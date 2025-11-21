
import React from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, FunctionCall } from '@google/genai';
import { Action, DocumentData, StartSessionConfig, TranscriptTurn, StreamConfig, SecurityStatus, MissionTask, MotionStatus } from '../types';
import { decode, decodeAudioData, createBlob, blobToBase64 } from '../utils/audio';
import { getUnifiedSystemInstruction } from '../lib/systemInstructions';
import { ToolDeclarations } from '../lib/ToolDeclarations';
import { executeToolCall, AgentContext } from '../lib/ToolExecutor';
import { getOptimalStreamConfig } from '../lib/resourceManager';
import { secureStorage } from '../lib/security';
import { detectBarcodesInFrame } from '../lib/nativeVision';

interface LiveSessionManagerOptions {
  dispatch: React.Dispatch<Action>;
}

export class LiveSessionManager {
    private dispatch: React.Dispatch<Action>;
    
    private sessionPromise: Promise<any> | null = null;
    private mediaStream: MediaStream | null = null;
    private inputAudioContext: AudioContext | null = null;
    private outputAudioContext: AudioContext | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null;
    private outputGainNode: GainNode | null = null;
    private sources = new Set<AudioBufferSourceNode>();
    private nextStartTime = 0;
    private frameInterval: number | null = null;

    private userTranscript = '';
    private assistantTranscript = '';
    private currentEmotion: string | null = null;
    
    // New Features State
    private directoryHandle: any | null = null; // FileSystemDirectoryHandle
    private ambientAudioNode: AudioBufferSourceNode | null = null; // For Focus Mode
    private wakeLock: WakeLockSentinel | null = null; // For Mobile Screen Keep-Awake
    
    // Track active session state for tools
    private currentSystemState: {
        isVisionEnabled: boolean;
        networkStatus: string;
        securityStatus: SecurityStatus;
        motionStatus: MotionStatus;
        location: { latitude: number, longitude: number } | null;
        isCoachingMode: boolean;
        isStealthMode: boolean;
        userVoiceReference: string | null;
        deviceHeading: number | null; // New for Magnetometer
        githubConfig: { token: string | null; repo: string | null };
    } = {
        isVisionEnabled: false,
        networkStatus: 'Optimal',
        securityStatus: 'open',
        motionStatus: 'Stationary',
        location: null,
        isCoachingMode: false,
        isStealthMode: false,
        userVoiceReference: null,
        deviceHeading: null,
        githubConfig: { token: null, repo: null },
    };

    // References passed from React
    private videoRef: React.RefObject<HTMLVideoElement> | null = null;

    constructor({ dispatch }: LiveSessionManagerOptions) {
        this.dispatch = dispatch;
    }
    
    setDirectoryHandle(handle: any) {
        this.directoryHandle = handle;
    }
    
    // Sends a hidden system command to the model that doesn't appear in the user's transcript
    sendSystemMessage(message: string) {
        if (this.sessionPromise) {
            this.sessionPromise.then(session => {
                console.log("Sending system message:", message);
                session.sendRealtimeInput({ text: message });
            }).catch(e => console.error("Failed to send system message", e));
        }
    }
    
    // --- Wake Lock Management ---
    private async requestWakeLock() {
        try {
            if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
                // @ts-ignore
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log("Screen Wake Lock active.");
                this.wakeLock?.addEventListener('release', () => {
                    console.log("Screen Wake Lock released.");
                });
            }
        } catch (err) {
            console.warn(`Wake Lock request failed:`, err);
        }
    }

    private async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
            } catch (err) {
                console.warn("Wake Lock release failed:", err);
            }
        }
    }

    async start(config: StartSessionConfig, options: any, videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>) {
        if (!navigator.onLine) {
            this.dispatch({ type: 'SET_ERROR', payload: "Cannot start session: You are offline." });
            return;
        }
        
        // Stop any existing session cleanly before starting a new one
        await this.stop(false);
        // Give a small buffer for socket closure
        await new Promise(resolve => setTimeout(resolve, 100));

        // Request screen to stay on (critical for mobile)
        await this.requestWakeLock();

        // Store ref for screenshot tool
        this.videoRef = videoRef;
        
        // Fetch latest GitHub config from storage directly to be safe, or rely on passed options if reliable
        let ghToken = options.githubConfig?.token;
        let ghRepo = options.githubConfig?.repo;
        if (!ghToken) ghToken = await secureStorage.getItem('githubToken');
        if (!ghRepo) ghRepo = await secureStorage.getItem('githubRepo');

        // Initialize local state tracking
        this.currentSystemState = {
            isVisionEnabled: options.isVisionEnabled,
            networkStatus: options.networkStatus,
            securityStatus: (options.userFaceDescription || options.userVoiceReference) ? 'locked' : 'open',
            motionStatus: options.motionStatus || 'Stationary',
            location: null,
            isCoachingMode: options.isCoachingMode || false,
            isStealthMode: options.isStealthMode || false,
            userVoiceReference: options.userVoiceReference || null,
            deviceHeading: options.deviceHeading || null, // Injected from context
            githubConfig: { token: ghToken, repo: ghRepo },
        };

        this.dispatch({ type: 'START_CONNECTING' });

        let resumedTranscript: string | undefined;
        if (config.resumedTurns && config.resumedTurns.length > 0) {
            this.dispatch({ type: 'SET_UI_STATE', payload: { transcriptHistory: [...config.resumedTurns] }});
            resumedTranscript = config.resumedTurns
                .map(turn => `User: ${turn.user}\nAssistant: ${turn.assistant}`)
                .join('\n');
        }

        try {
            // Get user's location for grounding
            let userLocation: { latitude: number; longitude: number; } | null = null;
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
                });
                userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                this.dispatch({ type: 'SET_USER_LOCATION', payload: userLocation });
                this.currentSystemState.location = userLocation;
            } catch (geoError) {
                console.warn("Could not get user location:", geoError);
            }

            const streamConfig = getOptimalStreamConfig(options.networkStatus);
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: options.isVisionEnabled ? {
                    facingMode: config.facingMode,
                    width: streamConfig.video.width,
                    height: streamConfig.video.height,
                } : false,
            });

            // Initialize videoRef with the camera stream
            if (videoRef.current && options.isVisionEnabled) {
                videoRef.current.srcObject = this.mediaStream;
            }

            // Initialize output AudioContext
            // Use standard AudioContext, handling prefix for legacy if needed
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
            
            // Critical for mobile: Resume context if suspended
            if (this.outputAudioContext.state === 'suspended') {
                await this.outputAudioContext.resume();
            }

            this.outputGainNode = this.outputAudioContext.createGain();
            this.outputGainNode.gain.value = options.volume;
            this.outputGainNode.connect(this.outputAudioContext.destination);
            this.nextStartTime = 0;
            this.sources.clear();
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const sessionConfig: any = {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voice } } },
                systemInstruction: getUnifiedSystemInstruction({
                    sourceLanguage: options.sourceLanguage,
                    targetLanguage: options.targetLanguage,
                    isVisionEnabled: options.isVisionEnabled,
                    semanticMemory: options.semanticMemory,
                    resumedTranscript: resumedTranscript,
                    userFaceDescription: options.userFaceDescription, // Pass face description
                    userVoiceReference: options.userVoiceReference, // Pass voice reference flag
                    hasProjectLoaded: !!this.directoryHandle,
                    userLocation: userLocation, // Pass location directly
                    missionTasks: options.missionTasks, // Pass active tasks
                    isCoachingMode: options.isCoachingMode, // Enable coaching shadow mode
                    isStealthMode: options.isStealthMode, // New Stealth mode
                }),
                tools: [{ functionDeclarations: Object.values(ToolDeclarations) }],
            };

            const connectWithRetry = async (attempt: number = 1): Promise<void> => {
                try {
                    console.log(`Connecting to Live API (Attempt ${attempt})...`);
                    this.sessionPromise = ai.live.connect({
                        model: 'gemini-2.0-flash-exp', // Using the stable experimental endpoint
                        callbacks: {
                            onopen: () => this.handleSessionOpen(options, videoRef, canvasRef, streamConfig),
                            onmessage: (msg) => this.handleSessionMessage(options.documentContent, msg),
                            onerror: (err) => this.handleSessionError(err),
                            onclose: () => this.handleSessionClose(),
                        },
                        config: sessionConfig,
                    });
                    await this.sessionPromise;
                } catch (e: any) {
                    console.error(`Connection attempt ${attempt} failed:`, e);
                    
                    const isRetriable = 
                        (e.message && (
                            e.message.toLowerCase().includes("unavailable") || 
                            e.message.includes("503") || 
                            e.message.toLowerCase().includes("network error") ||
                            e.message.toLowerCase().includes("fetch failed") ||
                            e.message.toLowerCase().includes("connection failed") ||
                            e.message.toLowerCase().includes("aborted")
                        ));

                    if (attempt <= 5 && isRetriable) { // Retry up to 5 times
                        // Add jitter to backoff to prevent thundering herd
                        const delay = 2000 * attempt + Math.random() * 1000;
                        console.warn(`Retriable error detected. Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return connectWithRetry(attempt + 1);
                    }
                    throw e;
                }
            };

            await connectWithRetry();
            
            // FORCE TRIGGER: If security is active, send a silent command to trigger the tool check
            // We wait 1.5s to ensure the video connection is established and frames are flowing.
            if (options.userFaceDescription || options.userVoiceReference) {
                setTimeout(() => {
                    if (options.userFaceDescription) {
                        this.sendSystemMessage("SYSTEM_TRIGGER: Analyze the video feed now. Call confirmBiometricIdentity.");
                    } else if (options.userVoiceReference) {
                        this.sendSystemMessage("SYSTEM_TRIGGER: Listen to the audio now. Compare it against the stored userVoiceReference. Call confirmBiometricIdentity.");
                    }
                }, 1500);
            }

            this.dispatch({ type: 'SESSION_STARTED' });

        } catch (e: any) {
            console.error("Failed to start session:", e);
            let msg = e.message || String(e);
            if (msg.toLowerCase().includes("network error")) {
                 msg = "Connection failed. Please check your network or API key.";
            }
            this.dispatch({ type: 'SET_ERROR', payload: `Session Error: ${msg}` });
            await this.stop(false);
        }
    }

    private async handleSessionOpen(options: any, videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>, streamConfig: StreamConfig) {
        console.log("Live session opened.");
        
        // GUARD: If mediaStream is missing, session was stopped during connection phase.
        if (!this.mediaStream) {
            console.warn("Session opened but media stream is missing (stopped?). Aborting initialization.");
            // If session promise exists, try to close it to prevent lingering connection
            if (this.sessionPromise) {
                 this.sessionPromise.then(session => session.close()).catch(() => {});
            }
            return;
        }

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
            
            // Critical for mobile inputs: ensure context is running
            if (this.inputAudioContext.state === 'suspended') {
                await this.inputAudioContext.resume();
            }

            // Double check stream hasn't been nulled during await
            if (!this.mediaStream) return;

            const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
            this.scriptProcessor.onaudioprocess = (event) => {
                // Guard against processing if stopped
                if (!this.inputAudioContext || !this.sessionPromise) return;

                const inputData = event.inputBuffer.getChannelData(0);
                // Pass the actual sample rate to createBlob
                const pcmBlob = createBlob(inputData, this.inputAudioContext.sampleRate || 16000);
                
                this.sessionPromise.then(session => {
                    try {
                        session.sendRealtimeInput({ media: pcmBlob });
                    } catch (e) {
                        // Ignore send errors if closed
                    }
                }).catch(() => {});
            };
            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.inputAudioContext.destination);

            if (options.isVisionEnabled && videoRef.current && canvasRef.current) {
                const videoEl = videoRef.current;
                const canvasEl = canvasRef.current;
                const ctx = canvasEl.getContext('2d');
                if (this.frameInterval) clearInterval(this.frameInterval);
                
                this.frameInterval = window.setInterval(() => {
                    if (!this.sessionPromise) return; // Stop loop if session gone

                    // Check if the video element has a valid source and is playing
                    if (ctx && videoEl.videoWidth > 0) {
                        canvasEl.width = videoEl.videoWidth;
                        canvasEl.height = videoEl.videoHeight;
                        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                        canvasEl.toBlob(async (blob) => {
                            if (blob && this.sessionPromise) {
                                try {
                                    const base64Data = await blobToBase64(blob);
                                    this.sessionPromise.then(session => session.sendRealtimeInput({
                                        media: { data: base64Data, mimeType: 'image/jpeg' }
                                    })).catch(() => {});
                                } catch (e) {
                                    // ignore
                                }
                            }
                        }, 'image/jpeg', 0.8);
                    }
                }, 1000 / streamConfig.video.frameRate);
            }
        } catch (e: any) {
            console.error("Error in handleSessionOpen:", e);
            this.dispatch({ type: 'SET_ERROR', payload: "Failed to initialize media inputs." });
            this.stop(false);
        }
    }

    private async handleSessionMessage(documentContent: DocumentData | null, message: LiveServerMessage) {
        if (message.serverContent?.groundingMetadata?.groundingChunks) {
            this.dispatch({ type: 'SET_GROUNDING_CHUNKS', payload: message.serverContent.groundingMetadata.groundingChunks });
        }
        
        if (message.toolCall) {
            this.handleToolCalls(message.toolCall.functionCalls, documentContent);
        }

        if (message.serverContent?.inputTranscription) {
            this.userTranscript += message.serverContent.inputTranscription.text;
            this.dispatch({ type: 'UPDATE_USER_TRANSCRIPT', payload: this.userTranscript });
        }
        if (message.serverContent?.outputTranscription) {
            this.assistantTranscript += message.serverContent.outputTranscription.text;
            this.dispatch({ type: 'UPDATE_ASSISTANT_TRANSCRIPT', payload: this.assistantTranscript });
        }
        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
            this.playAudio(message.serverContent.modelTurn.parts[0].inlineData.data);
        }
        if (message.serverContent?.interrupted) {
            this.stopAllAudio();
        }
        if (message.serverContent?.turnComplete) {
            const finalTurn: TranscriptTurn = {
                id: Date.now(),
                user: this.userTranscript.trim(),
                assistant: this.assistantTranscript.trim(),
                emotion: this.currentEmotion ?? undefined,
            };
            this.dispatch({ type: 'ADD_TRANSCRIPT_TURN', payload: finalTurn });
            this.dispatch({ type: 'CLEAR_CURRENT_TURN' });
            this.userTranscript = '';
            this.assistantTranscript = '';
            this.currentEmotion = null;
        }
    }
    
    // Start Brown Noise Generation (Focus Mode)
    private startAmbientAudio() {
        if (!this.outputAudioContext || !this.ambientAudioNode) return;
        
        const bufferSize = this.outputAudioContext.sampleRate * 2; // 2 seconds buffer
        const buffer = this.outputAudioContext.createBuffer(1, bufferSize, this.outputAudioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate White Noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = this.outputAudioContext.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        
        // Create Low Pass Filter to make it Brown Noise (softer, deeper)
        const filter = this.outputAudioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Cutoff at 400Hz for deep rumble

        const gain = this.outputAudioContext.createGain();
        gain.gain.value = 0.15; // Low volume

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.outputAudioContext.destination);
        
        noiseSource.start();
        this.ambientAudioNode = noiseSource;
    }

    private stopAmbientAudio() {
        if (this.ambientAudioNode) {
            try { this.ambientAudioNode.stop(); } catch(e) {}
            this.ambientAudioNode = null;
        }
    }

    // --- Client Hook Implementation ---
    private async captureScreenHook(filename: string): Promise<string> {
        if (!this.videoRef || !this.videoRef.current) return "Camera/Screen not active.";
        
        const video = this.videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return "Failed to create canvas context.";
        
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        link.click();
        
        return "Screenshot saved to downloads.";
    }

    private async copyToClipboardHook(content: string): Promise<string> {
        try {
            await navigator.clipboard.writeText(content);
            return "Content copied to system clipboard.";
        } catch (e) {
            return "Failed to copy to clipboard. Permissions may be blocked.";
        }
    }
    
    // New Hook for Visual Ingestion
    private async scanVisualCodesHook(): Promise<string[]> {
        if (!this.videoRef || !this.videoRef.current) return [];
        try {
            return await detectBarcodesInFrame(this.videoRef.current);
        } catch (e) {
            console.warn("Scan failed", e);
            return [];
        }
    }
    
    private async handleToolCalls(functionCalls: FunctionCall[], documentContent: DocumentData | null) {
        for (const fc of functionCalls) {
            console.log(`Received tool call: ${fc.name}`, fc.args);
            this.dispatch({ type: 'SET_TOOL_CALL', payload: { name: fc.name, args: fc.args } });
            
            const session = await this.sessionPromise;
            let result;
            const args = fc.args as any;

            // Create Context for Tool Execution
            const toolContext: AgentContext = {
                documentContent,
                directoryHandle: this.directoryHandle,
                clientHooks: {
                    captureScreen: this.captureScreenHook.bind(this),
                    copyToClipboard: this.copyToClipboardHook.bind(this),
                    scanVisualCodes: this.scanVisualCodesHook.bind(this),
                    setCoachingTip: (tip) => this.dispatch({ type: 'SET_COACHING_TIP', payload: tip }),
                    refreshWallet: (wallet) => this.dispatch({ type: 'SET_PAPER_WALLET', payload: wallet }),
                },
                systemStatus: { 
                    ...this.currentSystemState,
                    isOnline: navigator.onLine
                },
                githubConfig: this.currentSystemState.githubConfig,
            };

            // Handle special internal tool calls
            if (fc.name === 'displayEmotionAndRespond') {
                this.currentEmotion = args.emotion;
                this.assistantTranscript += args.response;
                this.dispatch({ type: 'SET_CURRENT_EMOTION', payload: this.currentEmotion });
                this.dispatch({ type: 'UPDATE_ASSISTANT_TRANSCRIPT', payload: this.assistantTranscript });
                result = { result: "Emotion displayed to user." };
            } else if (fc.name === 'updateSemanticMemory') {
                this.dispatch({ type: 'UPDATE_SEMANTIC_MEMORY', payload: { newPreference: args.newPreference } });
                result = { result: "User preference has been saved." };
            } else if (fc.name === 'confirmBiometricIdentity') {
                 const isMatch = args.match;
                 if (isMatch) {
                     this.dispatch({ type: 'SET_SECURITY_STATUS', payload: 'unlocked' });
                     this.currentSystemState.securityStatus = 'unlocked';
                     result = { result: "Biometric verification SUCCESSFUL. Security UNLOCKED." };
                 } else {
                     this.dispatch({ type: 'SET_SECURITY_STATUS', payload: 'locked' });
                     this.currentSystemState.securityStatus = 'locked';
                     result = { result: "Biometric verification FAILED. Security LOCKED. Access denied." };
                 }

            } else if (fc.name === 'generateChart') {
                 const chartTurn: TranscriptTurn = {
                     id: Date.now(),
                     user: "",
                     assistant: "",
                     chartData: { title: args.title, type: args.type, data: args.data },
                     isAutonomous: true 
                 };
                 this.dispatch({ type: 'ADD_TRANSCRIPT_TURN', payload: chartTurn });
                 result = await executeToolCall(fc, toolContext);

            } else if (fc.name === 'playAmbientAudio') {
                 if (args.action === 'start') {
                     this.startAmbientAudio();
                     result = { result: "Started playing ambient focus noise." };
                 } else {
                     this.stopAmbientAudio();
                     result = { result: "Stopped ambient audio." };
                 }
            } else if (fc.name === 'manageMission') {
                let currentTasks: MissionTask[] = [];
                try {
                    const tasks = await secureStorage.getItem('missionTasks');
                    if (tasks) currentTasks = tasks;
                } catch (e) {
                     console.warn("Failed to read tasks from secure storage", e);
                }

                const { action, taskDescription, taskId } = args;
                
                if (action === 'add' && taskDescription) {
                    const newTask: MissionTask = { id: Date.now().toString(), description: taskDescription, status: 'pending', createdAt: new Date().toISOString() };
                    currentTasks = [...currentTasks, newTask];
                    result = { result: `Task added: "${taskDescription}"` };
                } else if (action === 'complete' && taskId) {
                    currentTasks = currentTasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t);
                    result = { result: `Task ${taskId} marked as completed.` };
                } else if (action === 'delete' && taskId) {
                    currentTasks = currentTasks.filter(t => t.id !== taskId);
                    result = { result: `Task ${taskId} deleted.` };
                } else if (action === 'list') {
                    const list = currentTasks.map(t => `[${t.status.toUpperCase()}] ${t.description} (ID: ${t.id})`).join('\n');
                    result = { result: `Current Mission Log:\n${list || 'No active tasks.'}` };
                } else {
                    result = { result: "Invalid action or missing parameters." };
                }
                
                this.dispatch({ type: 'UPDATE_MISSION_TASKS', payload: currentTasks });

            } else {
                 // Default Route for most tools
                 result = await executeToolCall(fc, toolContext);
            }
            
            // Send tool response back to the model
            if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                    session.sendToolResponse({
                        functionResponses: [{
                            id: fc.id,
                            name: fc.name,
                            response: result || { result: "Action executed." }
                        }]
                    });
                }).catch(e => console.error("Failed to send tool response", e));
            }
        }
    }

    private handleSessionError(error: any) {
        console.error("Session error:", error);
        let msg = "Unknown session error";
        if (error instanceof Error) {
            msg = error.message;
        } else if (typeof error === 'string') {
            msg = error;
        } else if (error?.message) {
            msg = error.message;
        }
        
        if (msg.toLowerCase().includes("network error")) {
             msg = "Connection dropped. Check network.";
        }
        this.dispatch({ type: 'SET_ERROR', payload: msg });
        this.stop(false);
    }

    private handleSessionClose() {
        console.log("Session closed");
        this.stop(true);
    }

    async stop(saveHistory: boolean = true) {
        this.dispatch({ type: 'SESSION_CLEANUP' }); // Sets isListening to false, updates UI
        
        const currentSessionPromise = this.sessionPromise;
        this.sessionPromise = null;
        
        // Cleanly close session if it exists to prevent ghosts
        if (currentSessionPromise) {
             currentSessionPromise.then(session => {
                 try { session.close(); } catch(e) { console.warn("Clean close failed", e); }
             }).catch(() => {});
        }
        
        this.stopAllAudio();
        this.stopAmbientAudio();
        await this.releaseWakeLock();

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.inputAudioContext) {
            this.inputAudioContext.close();
            this.inputAudioContext = null;
        }
        if (this.outputAudioContext) {
            this.outputAudioContext.close();
            this.outputAudioContext = null;
        }
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
        }
    }

    private playAudio(base64Data: string) {
        if (!this.outputAudioContext || !this.outputGainNode) return;
        
        const audioData = decode(base64Data);
        decodeAudioData(audioData, this.outputAudioContext, 24000, 1).then(buffer => {
            if (!this.outputAudioContext || !this.outputGainNode) return;
            
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.outputGainNode);
            source.onended = () => {
                this.sources.delete(source);
            };
            
            // Simple scheduling to avoid overlap
            const currentTime = this.outputAudioContext.currentTime;
            const startTime = Math.max(currentTime, this.nextStartTime);
            source.start(startTime);
            this.nextStartTime = startTime + buffer.duration;
            
            this.sources.add(source);
        }).catch(e => console.error("Audio decode failed", e));
    }
    
    private stopAllAudio() {
        this.sources.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        this.sources.clear();
        this.nextStartTime = 0;
    }

    sendTextMessage(text: string) {
        if (this.sessionPromise) {
            this.userTranscript += text;
            this.dispatch({ type: 'UPDATE_USER_TRANSCRIPT', payload: this.userTranscript });
            this.sessionPromise.then(session => {
                 session.sendRealtimeInput({ text });
            }).catch(e => console.error("Failed to send text message", e));
        }
    }
    
    getMediaStream() {
        return this.mediaStream;
    }
    
    setVolume(volume: number) {
        if (this.outputGainNode) {
            this.outputGainNode.gain.value = volume;
        }
    }
}
