
import React, { useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai"; // Added import
import LanguageSelector from './components/LanguageSelector';
import VoiceSelector from './components/VoiceSelector';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import HistoryModal from './components/HistoryModal';
import DocumentationModal from './components/DocumentationModal';
import EmotionalMeter from './components/EmotionalMeter';
import { MicrophoneIcon, StopIcon, VolumeIcon, LoadingSpinner, HistoryIcon, CameraFlipIcon, PaperAirplaneIcon, WifiIcon, WifiOffIcon, CloseIcon, ShieldCheckIcon, LockClosedIcon, FingerPrintIcon, BookOpenIcon, ComputerDesktopIcon, FolderOpenIcon, MusicalNoteIcon } from './components/icons';
import { useCognitiveEngine } from './hooks/useCognitiveEngine';
import NetworkStatusIndicator from './components/NetworkStatusIndicator';
import FileUpload from './components/FileUpload';
import { useAppContext } from './store/AppContext';
import GroundingSources from './components/GroundingSources';
import { SecurityStatus } from './types';

// Helper hook to track internet status and update global state
const useInternetStatus = () => {
    const { dispatch } = useAppContext();

    useEffect(() => {
        const handleOnline = () => dispatch({ type: 'SET_IS_ONLINE', payload: true });
        const handleOffline = () => dispatch({ type: 'SET_IS_ONLINE', payload: false });

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Set initial state
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
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ease-in-out ${display.color}`} title={`Internet Status: ${display.label}`}>
            <display.Icon className="w-5 h-5" />
            <span>{display.label}</span>
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
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ease-in-out ${display.color}`} title={`Security Status: ${display.label}`}>
            <display.Icon className="w-5 h-5" />
            <span>{display.label}</span>
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
        toolCallStatus, groundingChunks, securityStatus, userFaceDescription, isScreenSharing, projectName
    } = state;

    useInternetStatus();

    const {
        videoRef, canvasRef,
        handleFileUpload, sendTextMessage,
        startSession, stopSession, handleClearHistory, handleToggleScreenShare, handleLoadProject
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
        
        // We use isConnecting as a loading state for registration too
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
            // Using Flash for quick one-off analysis
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                        { text: "Identify the person in this image. Provide a concise physical description (approx 30 words) focusing on distinguishing facial features (hair color/style, glasses, facial hair, approximate age) to be used as a security biometric reference. Start with 'A user with...'." }
                    ]
                }
            });
            
            const description = response.text;
            if (description) {
                dispatch({ type: 'SET_USER_FACE_DESCRIPTION', payload: description });
                dispatch({ type: 'SET_SECURITY_STATUS', payload: 'unlocked' }); // Immediate unlock upon registration
                alert("Face ID Registered Successfully.");
            }
        } catch (e: any) {
            console.error("Registration failed", e);
            dispatch({ type: 'SET_ERROR', payload: "Face registration failed. Please try again." });
        } finally {
            dispatch({ type: 'SET_UI_STATE', payload: { isConnecting: false } });
        }
    };

    const handleClearFaceID = () => {
        if (window.confirm("Are you sure you want to remove your Face ID? The app will no longer be locked.")) {
            dispatch({ type: 'SET_USER_FACE_DESCRIPTION', payload: null });
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 lg:p-8">
            <div className="w-full max-w-6xl mx-auto flex flex-col space-y-6">
                <header className="text-center sm:flex sm:justify-between sm:items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Issie: Unified Cognitive Agent</h1>
                        <p className="mt-2 text-lg text-gray-400">Your real-time AI assistant that sees, hears, and understands.</p>
                    </div>
                     <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                        <button 
                            onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { isDocsOpen: true } })}
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                            title="View Documentation"
                        >
                            <BookOpenIcon className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { isHistoryOpen: true } })}
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                            title="View conversation history"
                        >
                            <HistoryIcon className="w-6 h-6" />
                        </button>
                        <SecurityStatusDisplay status={securityStatus} />
                        <InternetStatus isOnline={isOnline} />
                        <NetworkStatusIndicator status={networkStatus} />
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                    <div className="lg:col-span-1 space-y-6 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-xl font-bold border-b border-gray-600 pb-2">Settings</h2>
                        <LanguageSelector title="Source Language" value={sourceLanguage} onChange={val => dispatch({ type: 'SET_UI_STATE', payload: { sourceLanguage: val } })} disabled={isListening || isConnecting || !isOnline} allowAuto disabledLanguage={targetLanguage} />
                        <LanguageSelector title="Target Language" value={targetLanguage} onChange={val => dispatch({ type: 'SET_UI_STATE', payload: { targetLanguage: val } })} disabled={isListening || isConnecting || !isOnline} disabledLanguage={sourceLanguage === 'auto' ? undefined : sourceLanguage} />
                        <VoiceSelector value={voice} onChange={val => dispatch({ type: 'SET_UI_STATE', payload: { voice: val } })} disabled={isListening || isConnecting || !isOnline} />
                        
                        <div className="space-y-2">
                            <label htmlFor="volume" className="text-sm font-medium text-gray-400 flex items-center gap-2"><VolumeIcon className="w-5 h-5" /> Volume</label>
                            <input type="range" id="volume" min="0" max="1" step="0.1" value={volume} onChange={e => dispatch({ type: 'SET_UI_STATE', payload: { volume: parseFloat(e.target.value) } })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-400">Enable Vision</span>
                            <button
                                onClick={() => dispatch({ type: 'SET_UI_STATE', payload: { isVisionEnabled: !isVisionEnabled } })}
                                disabled={isListening || isConnecting || !isOnline}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 ${isVisionEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isVisionEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                         {/* Biometric Security Section */}
                        <div className="pt-4 border-t border-gray-700 space-y-2">
                            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2"><LockClosedIcon className="w-4 h-4" /> Biometric Security</h3>
                            {userFaceDescription ? (
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs text-green-400 flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3" /> Face ID Active</p>
                                    <button 
                                        onClick={handleClearFaceID}
                                        className="w-full px-3 py-2 text-sm text-red-300 bg-red-900/30 border border-red-800 rounded hover:bg-red-900/50 transition-colors"
                                    >
                                        Reset Face ID
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs text-gray-500">Register your face to lock the app to you.</p>
                                    <button 
                                        onClick={handleRegisterFace}
                                        disabled={!isListening || !isVisionEnabled || isConnecting}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FingerPrintIcon className="w-4 h-4" />
                                        {isConnecting ? 'Scanning...' : 'Register Face ID'}
                                    </button>
                                    {(!isListening || !isVisionEnabled) && (
                                        <p className="text-xs text-yellow-500/80">Start session with vision to register.</p>
                                    )}
                                </div>
                            )}
                        </div>


                        <div className="pt-4 border-t border-gray-700 space-y-4">
                            <FileUpload onFileUpload={handleFileUpload} disabled={isListening || isConnecting || !isOnline} />
                            {documentName && <p className="text-xs text-gray-400 mt-2">Loaded Doc: {documentName}</p>}

                            <button
                                onClick={handleLoadProject}
                                disabled={isListening || isConnecting || !isOnline}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Mount a local directory for the AI to analyze"
                            >
                                <FolderOpenIcon className="w-4 h-4" />
                                <span>Mount Local Project</span>
                            </button>
                            {projectName && <p className="text-xs text-emerald-400">Project Mounted: {projectName}</p>}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 group">
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${isVisionEnabled && isListening ? 'opacity-100' : 'opacity-0'}`} />
                            <canvas ref={canvasRef} className="hidden" />
                            
                            {(!isVisionEnabled || !isListening) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/80 p-4">
                                    <h3 className="text-lg font-semibold text-white">{isVisionEnabled ? "Vision is ready." : "Vision is disabled."}</h3>
                                    <p className="text-gray-400">{isVisionEnabled ? "Start the session to activate the camera." : "Enable vision in settings to see the world."}</p>
                                </div>
                            )}

                            {isVisionEnabled && isListening && (
                                <>
                                    <EmotionalMeter emotion={currentEmotion} />
                                    {/* Controls Overlay */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button onClick={handleFlipCamera} disabled={isFlippingCamera || !isOnline || isScreenSharing} className="p-2 bg-black/50 rounded-full hover:bg-black/80 transition-colors disabled:opacity-50 text-white" title="Flip Camera">
                                            {isFlippingCamera ? <LoadingSpinner className="w-5 h-5" /> : <CameraFlipIcon className="w-5 h-5" />}
                                        </button>
                                        <button 
                                            onClick={handleToggleScreenShare} 
                                            className={`p-2 rounded-full transition-colors text-white ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black/50 hover:bg-black/80'}`}
                                            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
                                        >
                                            <ComputerDesktopIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {isScreenSharing && (
                                        <div className="absolute bottom-4 left-4 bg-blue-600/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                                            <ComputerDesktopIcon className="w-4 h-4" />
                                            Sharing Screen
                                        </div>
                                    )}
                                    <TranscriptionDisplay
                                        isOverlay
                                        history={transcriptHistory}
                                        currentUserTranscript={userTranscript}
                                        currentAssistantTranscript={assistantTranscript}
                                        toolCallStatus={toolCallStatus}
                                    />
                                </>
                            )}
                        </div>
                        
                        {(!isVisionEnabled || !isListening) && (
                            <TranscriptionDisplay
                                history={transcriptHistory}
                                currentUserTranscript={userTranscript}
                                currentAssistantTranscript={assistantTranscript}
                                toolCallStatus={toolCallStatus}
                            />
                        )}
                    </div>
                </main>

                <footer className="w-full flex flex-col items-center space-y-4">
                    <button
                        onClick={handleToggleListen}
                        disabled={!isOnline}
                        className={`relative flex items-center justify-center w-24 h-24 rounded-full text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900
                            ${isListening ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 animate-pulse-red-ring' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}
                            ${!isOnline ? 'bg-gray-600 cursor-not-allowed' : ''}`}
                        aria-label={isListening ? 'Stop session' : 'Start session'}
                    >
                        {isConnecting ? <LoadingSpinner className="w-12 h-12" /> : (isListening ? <StopIcon className="w-10 h-10" /> : <MicrophoneIcon className="w-12 h-12" />)}
                    </button>
                    <GroundingSources chunks={groundingChunks} />
                    <form onSubmit={handleSendText} className="w-full max-w-lg flex gap-2">
                        <input
                            type="text"
                            value={textInput}
                            onChange={e => dispatch({ type: 'SET_UI_STATE', payload: { textInput: e.target.value } })}
                            placeholder="Type a message..."
                            disabled={!isListening || !isOnline}
                            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        />
                        <button type="submit" disabled={!isListening || !textInput.trim() || !isOnline} className="p-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                            <PaperAirplaneIcon className="w-6 h-6" />
                        </button>
                    </form>
                </footer>

                {interruptedSession && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
                        <div className="bg-gray-700 rounded-lg shadow-lg p-4 flex items-center justify-between mx-4">
                            <p className="text-sm font-medium">It looks like you were disconnected.</p>
                            <div className="flex gap-2">
                                <button onClick={handleResumeSession} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">Resume</button>
                                <button onClick={handleDismissResume} className="p-1 hover:bg-gray-600 rounded-full"><CloseIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                )}

                {!isOnline && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
                        <div className="bg-red-800/90 border border-red-600 rounded-lg shadow-lg p-4 flex items-center justify-center mx-4 gap-2">
                            <WifiOffIcon className="w-5 h-5"/>
                            <p className="text-sm font-medium">You are offline. Functionality is limited.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
                        <div className="bg-red-800/90 border border-red-600 rounded-lg shadow-lg p-4 flex items-center justify-between mx-4">
                            <p className="text-sm font-medium">{error}</p>
                            <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} className="p-1 hover:bg-red-700 rounded-full"><CloseIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}

                <HistoryModal isOpen={isHistoryOpen} onClose={() => dispatch({ type: 'SET_UI_STATE', payload: { isHistoryOpen: false }})} sessions={conversationHistory} onClearHistory={handleClearHistory} />
                <DocumentationModal isOpen={isDocsOpen} onClose={() => dispatch({ type: 'SET_UI_STATE', payload: { isDocsOpen: false }})} />

            </div>
        </div>
    );
};

export default App;
