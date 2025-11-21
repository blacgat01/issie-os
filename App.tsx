
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import LanguageSelector from './components/LanguageSelector';
import VoiceSelector from './components/VoiceSelector';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import HistoryModal from './components/HistoryModal';
import DocumentationModal from './components/DocumentationModal';
import EmotionalMeter from './components/EmotionalMeter';
import { MicrophoneIcon, StopIcon, VolumeIcon, LoadingSpinner, HistoryIcon, CameraFlipIcon, PaperAirplaneIcon, WifiIcon, WifiOffIcon, CloseIcon, ShieldCheckIcon, LockClosedIcon, FingerPrintIcon, BookOpenIcon, ComputerDesktopIcon, FolderOpenIcon, MusicalNoteIcon, WrenchScrewdriverIcon, Battery100Icon, Battery50Icon, Battery0Icon, BoltIcon, ArrowDownTrayIcon, Bars3Icon, XMarkIcon, AcademicCapIcon, CompassIcon, EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, ChartBarIcon, KeyboardIcon, CubeIcon } from './components/icons';
import { useCognitiveEngine } from './hooks/useCognitiveEngine';
import NetworkStatusIndicator from './components/NetworkStatusIndicator';
import FileUpload from './components/FileUpload';
import { useAppContext } from './store/AppContext';
import GroundingSources from './components/GroundingSources';
import { SecurityStatus, MotionStatus, CoachingTip } from './types';
import { SystemAgent } from './lib/agents';
import { blobToBase64 } from './utils/audio';
import { isNanoAvailable } from './lib/nano';
import { initializeLightSensor } from './lib/sensors';
import WalletWidget from './components/WalletWidget';
import NotificationSystem from './components/NotificationSystem';
import AuditLogViewer from './components/AuditLogViewer';
import ARHeadset from './components/ARHeadset'; // Import new AR Component

// ... (Keep useInternetStatus, InternetStatus, RuntimeStatus, NanoStatus, SecurityStatusDisplay, BatteryMonitor, MotionMonitor, OrientationMonitor, AmbientMonitor, AgentHUD, CoachingHUD from previous file)
const useInternetStatus = () => {
    const { dispatch } = useAppContext();

    useEffect(() => {
        const handleOnline = () => dispatch({ type: 'SET_IS_ONLINE', payload: true });
        const handleOffline = () => dispatch({ type: 'SET_IS_ONLINE', payload: false });

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        handleOnline();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [dispatch]);
};

const InternetStatus: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
    const display = isOnline ? {
        Icon: WifiIcon,
        color: 'bg-green-500/20 text-green-300 border-green-500/50',
        label: 'Online',
    } : {
        Icon: WifiOffIcon,
        color: 'bg-red-500/20 text-red-300 border-red-500/50',
        label: 'Offline',
    };

    return (
        <div className={`flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ease-in-out ${display.color}`} title={`Network Status: ${display.label}`}>
            <display.Icon className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden md:inline">{display.label}</span>
        </div>
    );
};

const RuntimeStatus: React.FC = () => {
    const isNative = window.location.protocol === 'file:' || (window as any).Capacitor?.isNative;
    
    return (
        <div className={`hidden lg:flex items-center space-x-2 px-2 py-1 rounded text-[10px] font-mono border ${isNative ? 'bg-purple-900/30 border-purple-700 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-500'}`} title={isNative ? "Native Sovereign Mode" : "Web Sandbox Mode (Limited Hardware Access)"}>
            <span>RUNTIME: {isNative ? 'NATIVE' : 'WEB'}</span>
        </div>
    );
};

const NanoStatus: React.FC = () => {
    const [available, setAvailable] = useState(false);
    useEffect(() => {
        isNanoAvailable().then(setAvailable);
    }, []);

    if (!available) return null;

    return (
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-purple-500/20 text-purple-300 border-purple-500/50" title="Gemini Nano (Local Neural Engine) Active">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="font-mono text-xs">NANO</span>
        </div>
    );
};

const SecurityStatusDisplay: React.FC<{ status: SecurityStatus }> = ({ status }) => {
    if (status === 'open') return null;
    
    const display = status === 'unlocked' ? {
        Icon: ShieldCheckIcon,
        color: 'bg-green-500/20 text-green-300 border-green-500/50',
        label: 'Authenticated',
    } : {
        Icon: LockClosedIcon,
        color: 'bg-red-500/20 text-red-300 border-red-500/50',
        label: 'Locked',
    };

    return (
        <div className={`flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ease-in-out ${display.color}`} title={`Security Status: ${display.label}`}>
            <display.Icon className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden md:inline">{display.label}</span>
        </div>
    );
};

const BatteryMonitor: React.FC = () => {
    const [batteryState, setBatteryState] = useState<{ level: number, charging: boolean } | null>(null);

    useEffect(() => {
        if ('getBattery' in navigator) {
            // @ts-ignore
            navigator.getBattery().then((battery) => {
                const update = () => {
                    setBatteryState({
                        level: battery.level,
                        charging: battery.charging
                    });
                };
                
                update();
                
                if (battery.addEventListener) {
                    battery.addEventListener('levelchange', update);
                    battery.addEventListener('chargingchange', update);
                } else if (battery.onlevelchange !== undefined) {
                    battery.onlevelchange = update;
                    battery.onchargingchange = update;
                }
            }).catch(err => console.warn("Battery API failed:", err));
        }
    }, []);

    if (!batteryState) return null;

    const level = batteryState.level * 100;
    let Icon = Battery100Icon;
    let color = 'text-green-400';

    if (level <= 20) { Icon = Battery0Icon; color = 'text-red-400'; }
    else if (level <= 50) { Icon = Battery50Icon; color = 'text-yellow-400'; }

    return (
        <div className={`flex items-center gap-1 text-xs font-mono ${color}`} title={`${Math.round(level)}% ${batteryState.charging ? '(Charging)' : ''}`}>
             {batteryState.charging ? <BoltIcon className="w-4 h-4" /> : <Icon className="w-5 h-5" />}
             <span className="hidden sm:inline">{Math.round(level)}%</span>
        </div>
    );
};

const MotionMonitor: React.FC = () => {
    const { dispatch } = useAppContext();

    useEffect(() => {
        let lastX = 0, lastY = 0, lastZ = 0;
        let status: MotionStatus = 'Stationary';
        let lastUpdate = 0;

        const handleMotion = (event: DeviceMotionEvent) => {
            const now = Date.now();
            if (now - lastUpdate < 500) return; 
            lastUpdate = now;

            const acc = event.accelerationIncludingGravity;
            if (!acc) return;

            const x = acc.x || 0;
            const y = acc.y || 0;
            const z = acc.z || 0;

            const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
            
            let newStatus: MotionStatus = 'Stationary';
            if (delta > 15) newStatus = 'Active';
            else if (delta > 2) newStatus = 'Moving';

            if (newStatus !== status) {
                status = newStatus;
                dispatch({ type: 'SET_MOTION_STATUS', payload: status });
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        };

        if (typeof DeviceMotionEvent !== 'undefined') {
             window.addEventListener('devicemotion', handleMotion, true);
        }

        return () => window.removeEventListener('devicemotion', handleMotion, true);
    }, [dispatch]);

    return null;
};

const OrientationMonitor: React.FC = () => {
    const { dispatch } = useAppContext();

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) {
                if (Math.random() > 0.8) return; 
                const heading = 360 - event.alpha; 
                dispatch({ type: 'SET_DEVICE_HEADING', payload: heading });
            }
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        
        return () => window.removeEventListener('deviceorientation', handleOrientation, true);
    }, [dispatch]);

    return null;
};

const AmbientMonitor: React.FC = () => {
    const { dispatch } = useAppContext();
    
    useEffect(() => {
        const cleanup = initializeLightSensor((lux) => {
            dispatch({ type: 'SET_LIGHT_LEVEL', payload: lux });
        });
        return cleanup;
    }, [dispatch]);
    
    return null;
};

const AgentHUD: React.FC<{ toolCall: { name: string } | null }> = ({ toolCall }) => {
    if (!toolCall) return null;

    const getAgentInfo = (toolName: string) => {
        if (['getCryptoTechnicalAnalysis', 'generateChart', 'checkArbitrage', 'runBacktest', 'getMarketSentiment', 'getDexQuote', 'executePaperTrade'].includes(toolName)) return { name: 'TRADER', color: 'text-amber-400 border-amber-500/50' };
        if (['searchWeb', 'getWeatherForecast', 'getBatteryStatus', 'openUrl', 'scheduleMeeting', 'announceLocally'].includes(toolName)) return { name: 'NAVIGATOR', color: 'text-cyan-400 border-cyan-500/50' };
        if (['captureScreen', 'saveToDisk', 'copyToClipboard', 'readProjectFile', 'listDirectory', 'patchFile', 'pushToGitHub'].includes(toolName)) return { name: 'ENGINEER', color: 'text-emerald-400 border-emerald-500/50' };
        if (['confirmBiometricIdentity', 'getSystemStatus'].includes(toolName)) return { name: 'SENTINEL', color: 'text-red-400 border-red-500/50' };
        if (['generateCreativeConcept', 'playAmbientAudio', 'displayEmotionAndRespond'].includes(toolName)) return { name: 'DIRECTOR', color: 'text-purple-400 border-purple-500/50' };
        if (['manageMission'].includes(toolName)) return { name: 'COMMANDER', color: 'text-blue-400 border-blue-500/50' };
        if (['provideCoachingTip'].includes(toolName)) return { name: 'COACH', color: 'text-pink-400 border-pink-500/50' };
        return { name: 'SYSTEM', color: 'text-gray-400 border-gray-500/50' };
    };

    const agent = getAgentInfo(toolCall.name);

    return (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md border rounded-lg shadow-lg z-30 animate-in fade-in zoom-in duration-300 ${agent.color}`}>
            <div className="flex items-center gap-3">
                <div className="relative w-3 h-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                </div>
                <span className="text-xs font-bold tracking-widest uppercase">{agent.name} AGENT ACTIVE</span>
            </div>
        </div>
    );
};

const CoachingHUD: React.FC<{ tip: CoachingTip | null }> = ({ tip }) => {
    if (!tip) return null;
    
    const getColor = (sev: string) => {
        switch(sev) {
            case 'critical': return 'border-red-500 bg-red-900/80 text-white';
            case 'warning': return 'border-orange-500 bg-orange-900/80 text-white';
            default: return 'border-blue-500 bg-blue-900/80 text-blue-100';
        }
    };

    return (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-40 w-[90%] sm:w-auto max-w-md`}>
            <div className={`p-4 rounded-xl border-l-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-500 ${getColor(tip.severity)}`}>
                <div className="flex items-start gap-3">
                     <AcademicCapIcon className="w-6 h-6 flex-shrink-0 opacity-80" />
                     <div>
                         <h4 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Coaching Tip</h4>
                         <p className="text-lg font-bold leading-tight">{tip.text}</p>
                     </div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const {
        isOnline, sourceLanguage, targetLanguage, cameraFacingMode, voice, volume,
        isHistoryOpen, isDocsOpen, textInput, isVisionEnabled, interruptedSession, isListening,
        isConnecting, isFlippingCamera, error, userTranscript, assistantTranscript,
        transcriptHistory, conversationHistory, currentEmotion, networkStatus, documentName,
        toolCallStatus, groundingChunks, securityStatus, userFaceDescription, userVoiceReference, isScreenSharing, projectName, missionTasks, motionStatus,
        isCoachingMode, latestCoachingTip, deviceHeading, githubToken, githubRepo, isStealthMode, lightLevel
    } = state;

    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
    const [isRecordingVoice, setIsRecordingVoice] = useState(false); 
    const [activeSettingsTab, setActiveSettingsTab] = useState<'Feed' | 'Config' | 'Ops'>('Feed');
    const [isTextInputVisible, setIsTextInputVisible] = useState(false); 
    const [isARMode, setIsARMode] = useState(false); // AR MODE TOGGLE
    
    const [showGitHubForm, setShowGitHubForm] = useState(false);
    const [tempGhToken, setTempGhToken] = useState('');
    const [tempGhRepo, setTempGhRepo] = useState('');

    const sidebarScrollRef = useRef<HTMLDivElement>(null);

    useInternetStatus();

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    useEffect(() => {
        if (latestCoachingTip) {
            const timer = setTimeout(() => {
                dispatch({ type: 'SET_COACHING_TIP', payload: null });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [latestCoachingTip, dispatch]);

    // Auto-scroll sidebar when feed updates
    useEffect(() => {
        if (activeSettingsTab === 'Feed' && sidebarScrollRef.current) {
            sidebarScrollRef.current.scrollTop = sidebarScrollRef.current.scrollHeight;
        }
    }, [transcriptHistory, activeSettingsTab, userTranscript, assistantTranscript, toolCallStatus]);


    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    const {
        videoRef, canvasRef, legacyInputRef,
        handleFileUpload, sendTextMessage,
        startSession, stopSession, handleClearHistory, handleToggleScreenShare, handleLoadProject, handleLegacyFolderLoad,
        isScreenShareSupported
    } = useCognitiveEngine();
    
    useEffect(() => {
        try {
            const savedSession = sessionStorage.getItem('interruptedSession');
            if (savedSession) {
                dispatch({ type: 'SET_INTERRUPTED_SESSION', payload: JSON.parse(savedSession) });
            }
        } catch (e) {
            console.error("Could not parse interrupted session:", e);
            sessionStorage.removeItem('interruptedSession');
        }
    }, [dispatch]);

    const handleToggleListen = useCallback(() => {
        if (isListening || isConnecting) {
            stopSession();
        } else {
            startSession({ facingMode: cameraFacingMode });
        }
    }, [isListening, isConnecting, stopSession, startSession, cameraFacingMode]);

    const handleEmergencyStop = useCallback(async () => {
         await stopSession();
         window.location.reload();
    }, [stopSession]);

    const handleFlipCamera = useCallback(async () => {
        if (!isListening || !isVisionEnabled) return;
        dispatch({ type: 'SET_UI_STATE', payload: { isFlippingCamera: true } });
        const nextFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
        await stopSession(false); 
        await startSession({ facingMode: nextFacingMode });
        dispatch({ type: 'SET_UI_STATE', payload: { cameraFacingMode: nextFacingMode, isFlippingCamera: false }});
    }, [isListening, isVisionEnabled, cameraFacingMode, stopSession, startSession, dispatch]);
    
    const handleSendText = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim()) {
            sendTextMessage(textInput);
            dispatch({ type: 'SET_UI_STATE', payload: { textInput: '' }});
            setIsTextInputVisible(false); 
        }
    };
    
    const handleResumeSession = () => {
        if (interruptedSession) {
            startSession({ facingMode: cameraFacingMode, resumedTurns: interruptedSession });
            dispatch({ type: 'SET_INTERRUPTED_SESSION', payload: null });
            sessionStorage.removeItem('interruptedSession');
        }
    };

    const handleDismissResume = () => {
        dispatch({ type: 'SET_INTERRUPTED_SESSION', payload: null });
        sessionStorage.removeItem('interruptedSession');
    };

    const handleRegisterFace = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        dispatch({ type: 'SET_UI_STATE', payload: { isConnecting: true } });
        try {
            const videoEl = videoRef.current;
            const canvasEl = canvasRef.current;
            const ctx = canvasEl.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            ctx.drawImage(videoEl, 0, 0);
            const base64Image = canvasEl.toDataURL('image/jpeg').split(',')[1];
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                        { text: "Identify the person in this image for a security bio-lock. Provide a highly objective, physical description (approx 40 words) focusing ONLY on permanent or semi-permanent features: hair color/style, facial hair, glasses, approximate age range, gender. Do not use names." }
                    ]
                }
            });
            const desc = response.text;
            dispatch({ type: 'SET_USER_FACE_DESCRIPTION', payload: desc });
            dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "Face ID Registered & Locked", type: 'success' } });
        } catch (e: any) {
            console.error("Registration failed", e);
            dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "Face ID Failed: " + e.message, type: 'error' } });
        } finally {
            dispatch({ type: 'SET_UI_STATE', payload: { isConnecting: false } });
        }
    };
    
    const handleRegisterVoice = async () => {
        if (isRecordingVoice) return;
        setIsRecordingVoice(true);
        dispatch({ type: 'SET_UI_STATE', payload: { isConnecting: true } });
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' }); 
                const base64Audio = await blobToBase64(blob);
                
                dispatch({ type: 'SET_USER_VOICE_REFERENCE', payload: base64Audio });
                setIsRecordingVoice(false);
                dispatch({ type: 'SET_UI_STATE', payload: { isConnecting: false } });
                dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "Voice ID Registered", type: 'success' } });
                
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 5000);
            
        } catch (e: any) {
            console.error("Voice registration failed", e);
             dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "Voice ID Failed: " + e.message, type: 'error' } });
            setIsRecordingVoice(false);
            dispatch({ type: 'SET_UI_STATE', payload: { isConnecting: false } });
        }
    };

    const handleRestoreSystem = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const text = await file.text();
            const success = await SystemAgent.restoreSnapshot(text);
            if (success) {
                dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "System Restored. Reloading...", type: 'success' } });
                setTimeout(() => window.location.reload(), 2000);
            } else {
                dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "Restore Failed. Corrupt snapshot.", type: 'error' } });
            }
        }
    };

    const saveGitHubConfig = () => {
        if (tempGhToken && tempGhRepo) {
            dispatch({ type: 'SET_GITHUB_CONFIG', payload: { token: tempGhToken, repo: tempGhRepo } });
            dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "GitHub Credentials Saved", type: 'success' } });
            setShowGitHubForm(false);
        } else {
            dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "Both Token and Repo required.", type: 'warning' } });
        }
    };

    const isLocked = securityStatus === 'locked';
    const themeClass = isStealthMode ? 'bg-black text-red-500' : 'bg-gray-900 text-gray-100';
    
    return (
        <div className={`h-[100dvh] font-sans overflow-hidden flex flex-col relative transition-colors duration-700 ${themeClass}`}>
            <NotificationSystem />
            <MotionMonitor />
            <OrientationMonitor />
            <AmbientMonitor />
            <HistoryModal isOpen={isHistoryOpen} onClose={() => dispatch({ type: 'SET_UI_STATE', payload: { isHistoryOpen: false } })} sessions={conversationHistory} onClearHistory={handleClearHistory} />
            <DocumentationModal isOpen={isDocsOpen} onClose={() => dispatch({ type: 'SET_UI_STATE', payload: { isDocsOpen: false } })} />

            {/* Header / Status Bar */}
            <header className={`flex-shrink-0 backdrop-blur-md border-b p-2 sm:p-3 flex items-center justify-between z-40 ${isStealthMode ? 'bg-black/90 border-red-900/30' : 'bg-gray-800/50 border-gray-700'}`}>
                <div className="flex items-center gap-2 sm:gap-4">
                    <h1 className={`text-lg font-bold tracking-wide hidden sm:block ${isStealthMode ? 'text-red-600' : 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'}`}>
                        ISSIE OS <span className="text-xs font-mono text-gray-500 ml-2">v2.1</span>
                    </h1>
                    <div className="flex items-center gap-1 sm:gap-2">
                         <InternetStatus isOnline={isOnline} />
                         <NetworkStatusIndicator status={networkStatus} />
                         <RuntimeStatus />
                         <NanoStatus />
                         <SecurityStatusDisplay status={securityStatus} />
                         <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ease-in-out ${motionStatus === 'Stationary' ? 'bg-gray-700/30 text-gray-400 border-gray-600' : 'bg-blue-500/20 text-blue-300 border-blue-500/50'}`}>
                            <span>{motionStatus}</span>
                         </div>
                         {deviceHeading !== null && (
                            <div className="hidden sm:flex items-center space-x-2 px-2 py-1.5 rounded-full bg-gray-700/30 border border-gray-600" title={`Compass Heading: ${Math.round(deviceHeading)}°`}>
                                <CompassIcon className="w-5 h-5" rotation={deviceHeading} />
                            </div>
                         )}
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <BatteryMonitor />
                    {installPrompt && (
                        <button onClick={handleInstallClick} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1">
                            <ArrowDownTrayIcon className="w-3 h-3" /> <span className="hidden sm:inline">Install</span>
                        </button>
                    )}
                    
                     <button 
                        onClick={() => setIsARMode(!isARMode)} 
                        className={`p-2 rounded-full transition-colors border ${isARMode ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500' : 'hover:bg-gray-700 text-gray-400 border-transparent'}`}
                        title="Toggle AR Headset Mode"
                    >
                        <CubeIcon className="w-5 h-5" />
                    </button>

                     <button 
                        onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { isStealthMode: !isStealthMode } })} 
                        className={`p-2 rounded-full transition-colors border ${isStealthMode ? 'bg-red-900/30 text-red-500 border-red-800' : 'hover:bg-gray-700 text-gray-400 border-transparent'}`} 
                    >
                        {isStealthMode ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                    
                    <button 
                        onClick={() => {
                            if (isListening) dispatch({ type: 'SHOW_NOTIFICATION', payload: { id: Date.now().toString(), message: "Stop active session first.", type: 'warning' } });
                            else dispatch({ type: 'SET_UI_STATE', payload: { isCoachingMode: !isCoachingMode } });
                        }} 
                        className={`p-2 rounded-full transition-colors border ${isCoachingMode ? 'bg-pink-600/20 text-pink-400 border-pink-500/50' : 'hover:bg-gray-700 text-gray-400 border-transparent'}`} 
                        title={isCoachingMode ? "Coaching Active" : "Enable Coaching"}
                    >
                        <AcademicCapIcon className="w-5 h-5" />
                    </button>

                    <button onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { isDocsOpen: true } })} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 transition-colors">
                        <BookOpenIcon className="w-5 h-5" />
                    </button>
                     <button onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { isHistoryOpen: true } })} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 transition-colors">
                        <HistoryIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="sm:hidden p-2 rounded-full hover:bg-gray-700 text-gray-400">
                         {isSettingsOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col sm:flex-row overflow-hidden">
                
                {/* VISION FEED (with AR Overlay if active) */}
                <div className={`relative flex-1 bg-black flex flex-col justify-center items-center overflow-hidden transition-all duration-500 ${isSettingsOpen ? 'hidden sm:flex' : 'flex'}`}>
                     
                     {/* AR HEADSET OVERLAY */}
                     {isARMode && isVisionEnabled && <ARHeadset videoRef={videoRef} />}

                     {/* STANDARD HUD ELEMENTS (Hide if AR Mode active to avoid clutter, or overlay if transparent) */}
                     {!isARMode && (
                        <>
                            <AgentHUD toolCall={toolCallStatus} />
                            <CoachingHUD tip={latestCoachingTip} />
                        </>
                     )}
                     
                     {isLocked && isListening && (
                         <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                             <div className="w-64 h-64 border-2 border-red-500/50 rounded-lg animate-pulse-red-ring flex items-center justify-center bg-black/20 backdrop-blur-sm">
                                 <div className="text-center">
                                     <span className="block text-red-400 font-mono font-bold animate-pulse mb-2">SCANNING BIOMETRICS...</span>
                                 </div>
                             </div>
                         </div>
                     )}

                     <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isListening && isVisionEnabled ? 'opacity-100' : 'opacity-0'}`}
                        style={{ transform: isARMode ? 'scaleX(-1)' : 'none' }} // Mirror in AR mode for intuitive hand tracking
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {(!isListening || !isVisionEnabled) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center space-y-4">
                                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 ${isConnecting ? 'animate-pulse' : ''}`}>
                                     {isConnecting ? <LoadingSpinner className="w-10 h-10 text-blue-400" /> : <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>}
                                </div>
                                <p className="text-gray-500 font-mono text-sm">{isConnecting ? 'INITIALIZING...' : 'STANDBY'}</p>
                            </div>
                        </div>
                    )}
                     
                     {/* Mobile Text Input Overlay */}
                     <div className={`absolute bottom-24 left-4 right-4 z-30 transition-all duration-300 transform ${isTextInputVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                        <form onSubmit={handleSendText} className="flex gap-2 bg-black/80 p-2 rounded-xl border border-gray-700 backdrop-blur-md shadow-2xl">
                            <input 
                                type="text" 
                                value={textInput}
                                onChange={(e) => dispatch({ type: 'SET_UI_STATE', payload: { textInput: e.target.value } })}
                                className="flex-1 bg-transparent border-none text-white focus:ring-0 text-sm px-2 placeholder-gray-400 outline-none"
                                placeholder="Type a message to Issie..."
                                autoFocus={isTextInputVisible}
                            />
                            <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                        </form>
                     </div>

                     {/* Mobile Bottom Controls */}
                     <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 sm:hidden z-30">
                        <button
                            onClick={() => setIsTextInputVisible(!isTextInputVisible)}
                            className={`p-3 rounded-full bg-gray-800/80 text-gray-300 border border-gray-600 backdrop-blur-sm ${isTextInputVisible ? 'bg-blue-600/50 text-white' : ''}`}
                        >
                            <KeyboardIcon className="w-6 h-6" />
                        </button>

                        <button
                            onClick={handleToggleListen}
                            className={`p-4 rounded-full shadow-lg transition-all transform active:scale-95 ${isListening ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
                        >
                            {isListening ? <StopIcon className="w-8 h-8" /> : <MicrophoneIcon className="w-8 h-8" />}
                        </button>
                        
                         <button
                            onClick={handleFlipCamera}
                            disabled={!isListening || !isVisionEnabled || isFlippingCamera}
                            className="p-3 rounded-full bg-gray-800/80 text-gray-300 border border-gray-600 backdrop-blur-sm"
                        >
                            <CameraFlipIcon className="w-6 h-6" />
                        </button>
                     </div>
                </div>

                {/* SIDEBAR CONTROLS */}
                <div className={`flex flex-col w-full sm:w-[400px] lg:w-[450px] border-l border-gray-700/50 bg-gray-900/95 backdrop-blur-xl transition-transform duration-300 absolute sm:relative inset-0 z-50 sm:z-auto transform ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}`}>
                    
                    <div className="sm:hidden flex items-center justify-between p-4 border-b border-gray-800">
                         <span className="font-bold text-gray-300">Control Deck</span>
                         <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-gray-400">
                             <XMarkIcon className="w-6 h-6" />
                         </button>
                    </div>

                    <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                        
                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-xs font-mono break-words">
                                <span className="font-bold block mb-1">ERROR:</span>
                                {error}
                            </div>
                        )}

                        {interruptedSession && (
                            <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg flex items-start gap-3">
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-blue-300 mb-1">Session Interrupted</h3>
                                    <button onClick={handleResumeSession} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded mt-2 mr-2">Resume</button>
                                    <button onClick={handleDismissResume} className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded mt-2">Dismiss</button>
                                </div>
                            </div>
                        )}
                        
                        {/* Navigation Tabs */}
                        <div className="grid grid-cols-3 gap-1 text-xs border-b border-gray-800 pb-2 mb-2">
                            <button 
                                onClick={() => setActiveSettingsTab('Feed')}
                                className={`py-2 text-center rounded font-bold ${activeSettingsTab === 'Feed' ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                LIVE FEED
                            </button>
                            <button 
                                onClick={() => setActiveSettingsTab('Config')}
                                className={`py-2 text-center rounded font-bold ${activeSettingsTab === 'Config' ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                CONFIG
                            </button>
                            <button 
                                onClick={() => setActiveSettingsTab('Ops')}
                                className={`py-2 text-center rounded font-bold ${activeSettingsTab === 'Ops' ? 'bg-gray-800 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                OPS
                            </button>
                        </div>
                        
                        {/* FEED TAB */}
                        <div className={activeSettingsTab === 'Feed' ? 'block space-y-4' : 'hidden'}>
                            <WalletWidget />
                             <div className="flex flex-col min-h-[200px]">
                                 <TranscriptionDisplay
                                    history={transcriptHistory}
                                    currentUserTranscript={userTranscript}
                                    currentAssistantTranscript={assistantTranscript}
                                    toolCallStatus={toolCallStatus}
                                 />
                                 {groundingChunks && <div className="mt-2"><GroundingSources chunks={groundingChunks} /></div>}
                            </div>
                        </div>

                        {/* CONFIG TAB */}
                        <div className={activeSettingsTab === 'Config' ? 'block space-y-4' : 'hidden'}>
                            <div className="bg-gray-800/30 p-3 rounded border border-gray-700">
                                <LanguageSelector
                                    value={sourceLanguage}
                                    onChange={(val) => dispatch({ type: 'SET_UI_STATE', payload: { sourceLanguage: val } })}
                                    disabled={isListening}
                                    title="Input Language"
                                    allowAuto
                                />
                            </div>
                            <div className="bg-gray-800/30 p-3 rounded border border-gray-700">
                                <LanguageSelector
                                    value={targetLanguage}
                                    onChange={(val) => dispatch({ type: 'SET_UI_STATE', payload: { targetLanguage: val } })}
                                    disabled={isListening}
                                    title="Output Language"
                                />
                            </div>
                            <div className="bg-gray-800/30 p-3 rounded border border-gray-700">
                                <VoiceSelector
                                    value={voice}
                                    onChange={(val) => dispatch({ type: 'SET_UI_STATE', payload: { voice: val } })}
                                    disabled={isListening}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { isVisionEnabled: !isVisionEnabled } })}
                                    disabled={isListening}
                                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium ${isVisionEnabled ? 'bg-blue-600/20 border-blue-600/50 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                >
                                    {isVisionEnabled ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                                    Vision
                                </button>
                                <button
                                    onClick={handleToggleScreenShare}
                                    disabled={!isListening || !isScreenShareSupported}
                                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-medium ${isScreenSharing ? 'bg-purple-600/20 border-purple-600/50 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-400 disabled:opacity-50'}`}
                                >
                                    <ComputerDesktopIcon className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                        </div>
                        
                        {/* OPS TAB */}
                        <div className={activeSettingsTab === 'Ops' ? 'block space-y-4' : 'hidden'}>
                            <div className="bg-gray-800/30 p-3 rounded border border-gray-700 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1"><FileUpload onFileUpload={handleFileUpload} disabled={isListening} /></div>
                                    <div className="flex-1">
                                        <button
                                            onClick={handleLoadProject}
                                            disabled={isListening}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-md border border-gray-600"
                                        >
                                            <FolderOpenIcon className="w-4 h-4" /> <span>Mount</span>
                                        </button>
                                        <input type="file" ref={legacyInputRef} className="hidden" onChange={handleLegacyFolderLoad} 
                                            // @ts-ignore
                                            webkitdirectory="" directory="" 
                                        />
                                    </div>
                                </div>
                                {projectName && <div className="text-xs text-emerald-400 flex items-center gap-1 pl-1"><FolderOpenIcon className="w-3 h-3" /> Mounted: {projectName}</div>}
                                {documentName && <div className="text-xs text-blue-400 flex items-center gap-1 pl-1"><ClipboardDocumentIcon className="w-3 h-3" /> File: {documentName}</div>}
                            </div>

                            <button onClick={handleRegisterFace} className="w-full flex justify-between px-3 py-3 bg-gray-800/50 hover:bg-gray-800 rounded text-sm text-gray-300 border border-gray-700 transition-colors">
                                <span className="flex items-center gap-2"><FingerPrintIcon className="w-4 h-4" /> Face ID Registration</span>
                                {userFaceDescription && <span className="text-green-400 text-xs bg-green-900/20 px-2 py-0.5 rounded">Active</span>}
                            </button>
                            <button onClick={handleRegisterVoice} className="w-full flex justify-between px-3 py-3 bg-gray-800/50 hover:bg-gray-800 rounded text-sm text-gray-300 border border-gray-700 transition-colors">
                                <span className="flex items-center gap-2"><MusicalNoteIcon className="w-4 h-4" /> Voice ID Registration</span>
                                {userVoiceReference && <span className="text-green-400 text-xs bg-green-900/20 px-2 py-0.5 rounded">Active</span>}
                            </button>
                            
                            <div className="bg-gray-800/50 rounded border border-gray-700 overflow-hidden">
                                <button onClick={() => setShowGitHubForm(!showGitHubForm)} className="w-full flex justify-between px-3 py-3 hover:bg-gray-800 text-sm text-gray-300 transition-colors">
                                    <span className="flex items-center gap-2"><WrenchScrewdriverIcon className="w-4 h-4" /> GitHub Credentials</span>
                                    {githubToken && <span className="text-green-400 text-xs bg-green-900/20 px-2 py-0.5 rounded">Linked</span>}
                                </button>
                                
                                {showGitHubForm && (
                                    <div className="p-3 bg-gray-900/50 border-t border-gray-700 space-y-3 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Personal Access Token</label>
                                            <input 
                                                type="password" 
                                                value={tempGhToken}
                                                onChange={(e) => setTempGhToken(e.target.value)}
                                                placeholder="ghp_..."
                                                className="w-full bg-gray-800 border border-gray-600 rounded text-xs p-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Repository (user/repo)</label>
                                            <input 
                                                type="text" 
                                                value={tempGhRepo}
                                                onChange={(e) => setTempGhRepo(e.target.value)}
                                                placeholder="username/issie-os"
                                                className="w-full bg-gray-800 border border-gray-600 rounded text-xs p-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={saveGitHubConfig} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-medium">Save Credentials</button>
                                            <button onClick={() => setShowGitHubForm(false)} className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-2 rounded">Cancel</button>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Tokens are encrypted locally using AES-256.</p>
                                    </div>
                                )}
                            </div>
                            
                            <label className="w-full flex justify-between px-3 py-3 bg-gray-800/50 hover:bg-gray-800 rounded text-sm text-gray-300 border border-gray-700 cursor-pointer transition-colors">
                                <span className="flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4" /> Restore System Snapshot</span>
                                <input type="file" className="hidden" accept=".json" onChange={handleRestoreSystem} />
                            </label>
                            
                            <div className="mt-4">
                                <AuditLogViewer variant="widget" />
                            </div>

                            <button onClick={handleEmergencyStop} className="w-full flex justify-between px-3 py-3 bg-red-900/20 hover:bg-red-900/40 rounded text-sm text-red-300 border border-red-800 mt-2 transition-colors">
                                <span className="flex items-center gap-2 font-bold"><XMarkIcon className="w-4 h-4" /> EMERGENCY STOP / RELOAD</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-900 border-t border-gray-800">
                        <form onSubmit={handleSendText} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={textInput}
                                onChange={(e) => dispatch({ type: 'SET_UI_STATE', payload: { textInput: e.target.value } })}
                                placeholder={isListening ? "Type to intervene..." : "Enter text prompt..."}
                                className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500"
                            />
                            <button
                                type="submit"
                                disabled={!textInput.trim() || !isListening}
                                className="p-2.5 text-blue-400 hover:text-white bg-gray-800 hover:bg-blue-600 border border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="flex items-center justify-between gap-4">
                             <div className="hidden sm:flex items-center gap-2 text-gray-400 flex-1">
                                <VolumeIcon className="w-5 h-5" />
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={volume}
                                    onChange={(e) => dispatch({ type: 'SET_UI_STATE', payload: { volume: parseFloat(e.target.value) } })}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                            
                             {/* Desktop Start/Stop Button */}
                            <button
                                onClick={handleToggleListen}
                                className={`hidden sm:flex items-center justify-center p-3 rounded-full shadow-lg transition-all transform active:scale-95 ${isListening ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}`}
                                title={isListening ? "Stop Session" : "Start Session"}
                            >
                                {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                            </button>

                             <button
                                onClick={handleFlipCamera}
                                disabled={!isListening || !isVisionEnabled || isFlippingCamera}
                                className="sm:hidden p-3 rounded-full bg-gray-800 text-gray-400 border border-gray-700"
                            >
                                <CameraFlipIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
