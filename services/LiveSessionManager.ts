
// FIX: Import React to resolve 'Cannot find namespace React' error for React types.
import React from 'react';
import { GoogleGenAI, LiveSession, Modality, LiveServerMessage, FunctionCall } from '@google/genai';
import { Action, DocumentData, StartSessionConfig, TranscriptTurn, StreamConfig } from '../types';
import { decode, decodeAudioData, createBlob, blobToBase64 } from '../utils/audio';
import { getUnifiedSystemInstruction } from '../lib/systemInstructions';
import { ToolDeclarations } from '../lib/ToolDeclarations';
import { executeToolCall } from '../lib/ToolExecutor';
import { getOptimalStreamConfig } from '../lib/resourceManager';

interface LiveSessionManagerOptions {
  dispatch: React.Dispatch<Action>;
}

export class LiveSessionManager {
    private dispatch: React.Dispatch<Action>;
    
    private sessionPromise: Promise<LiveSession> | null = null;
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

    constructor({ dispatch }: LiveSessionManagerOptions) {
        this.dispatch = dispatch;
    }
    
    setDirectoryHandle(handle: any) {
        this.directoryHandle = handle;
    }

    async start(config: StartSessionConfig, options: any, videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>) {
        if (!navigator.onLine) {
            this.dispatch({ type: 'SET_ERROR', payload: "Cannot start session: You are offline." });
            return;
        }

        await this.stop(false); // Ensure clean state
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
            // NOTE: Location capture kept for future tool expansion, but toolConfig is removed to prevent API errors
            let userLocation: { latitude: number; longitude: number; } | null = null;
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
                });
                userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                this.dispatch({ type: 'SET_USER_LOCATION', payload: userLocation });
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

            this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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
                    hasProjectLoaded: !!this.directoryHandle,
                }),
                tools: [{ functionDeclarations: Object.values(ToolDeclarations) }],
            };

            this.sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: this.handleSessionOpen.bind(this, options, videoRef, canvasRef, streamConfig),
                    onmessage: this.handleSessionMessage.bind(this, options.documentContent),
                    onerror: this.handleSessionError.bind(this),
                    onclose: this.handleSessionClose.bind(this),
                },
                config: sessionConfig,
            });

            this.dispatch({ type: 'SESSION_STARTED' });

        } catch (e: any) {
            console.error("Failed to start session:", e);
            this.dispatch({ type: 'SET_ERROR', payload: `Session Error: ${e.message}` });
        }
    }

    private handleSessionOpen(options: any, videoRef: React.RefObject<HTMLVideoElement>, canvasRef: React.RefObject<HTMLCanvasElement>, streamConfig: StreamConfig) {
        console.log("Live session opened.");
        this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        // IMPORTANT: Always use this.mediaStream (Microphone) for audio source, regardless of what videoRef is displaying (camera or screen)
        const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream!);
        this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
        this.scriptProcessor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            this.sessionPromise?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
        };
        source.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.inputAudioContext.destination);

        if (options.isVisionEnabled && videoRef.current && canvasRef.current) {
            const videoEl = videoRef.current;
            const canvasEl = canvasRef.current;
            const ctx = canvasEl.getContext('2d');
            if (this.frameInterval) clearInterval(this.frameInterval);
            this.frameInterval = window.setInterval(() => {
                // Check if the video element has a valid source and is playing
                if (ctx && videoEl.videoWidth > 0) {
                    canvasEl.width = videoEl.videoWidth;
                    canvasEl.height = videoEl.videoHeight;
                    ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                    canvasEl.toBlob(async (blob) => {
                        if (blob) {
                            const base64Data = await blobToBase64(blob);
                            this.sessionPromise?.then(session => session.sendRealtimeInput({
                                media: { data: base64Data, mimeType: 'image/jpeg' }
                            }));
                        }
                    }, 'image/jpeg', 0.8);
                }
            }, 1000 / streamConfig.video.frameRate);
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
        if (!this.outputAudioContext || this.ambientAudioNode) return;
        
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
    
    private async handleToolCalls(functionCalls: FunctionCall[], documentContent: DocumentData | null) {
        for (const fc of functionCalls) {
            console.log(`Received tool call: ${fc.name}`, fc.args);
            this.dispatch({ type: 'SET_TOOL_CALL', payload: { name: fc.name, args: fc.args } });
            
            const session = await this.sessionPromise;
            let result;

            // Handle special internal tool calls
            if (fc.name === 'displayEmotionAndRespond') {
                this.currentEmotion = fc.args.emotion;
                this.assistantTranscript += fc.args.response;
                this.dispatch({ type: 'SET_CURRENT_EMOTION', payload: this.currentEmotion });
                this.dispatch({ type: 'UPDATE_ASSISTANT_TRANSCRIPT', payload: this.assistantTranscript });
                result = { result: "Emotion displayed to user." };
            } else if (fc.name === 'updateSemanticMemory') {
                this.dispatch({ type: 'UPDATE_SEMANTIC_MEMORY', payload: { newPreference: fc.args.newPreference } });
                result = { result: "User preference has been saved." };
            } else if (fc.name === 'confirmBiometricIdentity') {
                 const isMatch = fc.args.match;
                 if (isMatch) {
                     this.dispatch({ type: 'SET_SECURITY_STATUS', payload: 'unlocked' });
                     result = { result: "Biometric verification SUCCESSFUL. Security UNLOCKED. You may now access full system capabilities." };
                 } else {
                     this.dispatch({ type: 'SET_SECURITY_STATUS', payload: 'locked' });
                     result = { result: "Biometric verification FAILED. Security LOCKED. Access denied." };
                 }
            } else if (fc.name === 'generateChart') {
                 const chartTurn: TranscriptTurn = {
                     id: Date.now(),
                     user: "",
                     assistant: "",
                     chartData: { title: fc.args.title, type: fc.args.type, data: fc.args.data },
                     isAutonomous: true 
                 };
                 this.dispatch({ type: 'ADD_TRANSCRIPT_TURN', payload: chartTurn });
                 result = await executeToolCall(fc, documentContent, this.directoryHandle);
            } else if (fc.name === 'playAmbientAudio') {
                 if (fc.args.action === 'start') {
                     this.startAmbientAudio();
                     result = { result: "Started playing ambient focus noise." };
                 } else {
                     this.stopAmbientAudio();
                     result = { result: "Stopped ambient audio." };
                 }
            } else {
                 // Execute all other external/simulated tools, passing directoryHandle
                result = await executeToolCall(fc, documentContent, this.directoryHandle);
            }

            session?.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: result } });
        }
    }

    private handleSessionError(e: ErrorEvent) {
        console.error("Live session error:", e);
        this.dispatch({ type: 'SET_ERROR', payload: `Session Error: ${e.message}` });
        this.stop(false);
    }

    private handleSessionClose() {
        console.log("Live session closed.");
        this.stop(false);
    }
    
    async stop(saveHistory = true) {
        if (this.frameInterval) clearInterval(this.frameInterval);
        this.frameInterval = null;

        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.mediaStream = null;

        this.scriptProcessor?.disconnect();
        this.scriptProcessor = null;
        this.inputAudioContext?.close();
        this.inputAudioContext = null;

        this.stopAllAudio();
        this.stopAmbientAudio(); // Stop focus mode
        this.outputAudioContext?.close();
        this.outputAudioContext = null;
        
        this.sessionPromise?.then(session => session.close()).catch(e => console.error("Error closing session:", e));
        this.sessionPromise = null;
        
        this.userTranscript = '';
        this.assistantTranscript = '';
        this.currentEmotion = null;
        
        if (!saveHistory) {
             this.dispatch({ type: 'SESSION_CLEANUP' });
        }
        
        sessionStorage.removeItem('interruptedSession');
    }

    private stopAllAudio() {
        this.sources.forEach(source => {
            try { source.stop(); } catch (e) { /* ignore */ }
            this.sources.delete(source);
        });
        this.nextStartTime = 0;
    }

    private async playAudio(base64Audio: string) {
        if (!this.outputAudioContext || !this.outputGainNode) return;
        try {
            const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputGainNode);
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
            source.onended = () => this.sources.delete(source);
        } catch (e) {
            console.error("Error playing audio:", e);
        }
    }
    
    sendTextMessage(message: string) {
        if (message.trim()) {
            const textTurn: TranscriptTurn = { id: Date.now(), user: message, assistant: '' };
            this.dispatch({ type: 'ADD_TRANSCRIPT_TURN', payload: textTurn });
            this.dispatch({ type: 'CLEAR_CURRENT_TURN' }); // Show message immediately
            this.sessionPromise?.then(session => session.sendRealtimeInput({ text: message }));
        }
    }
    
    setVolume(volume: number) {
        if (this.outputGainNode) {
            this.outputGainNode.gain.value = volume;
        }
    }
    
    getMediaStream(): MediaStream | null {
        return this.mediaStream;
    }
}
