
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { LiveSessionManager } from '../services/LiveSessionManager';
import { getRealNetworkStatus } from '../lib/resourceManager';
import { extractSemanticMemory } from '../memory/semantic';
import { ConversationSession, DocumentData, StartSessionConfig } from '../types';
import { secureStorage } from '../lib/security';
import { createVirtualFileSystem } from '../lib/virtualFileSystem';

export const useCognitiveEngine = () => {
    const { state, dispatch } = useAppContext();
    const {
        sourceLanguage, targetLanguage, voice, volume, isVisionEnabled,
        semanticMemory, networkStatus, documentContent, conversationHistory,
        transcriptHistory, isListening, userFaceDescription, isScreenSharing, missionTasks, isCoachingMode, isStealthMode
    } = state;

    const sessionManagerRef = useRef<LiveSessionManager | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Ref for the legacy file input fallback
    const legacyInputRef = useRef<HTMLInputElement>(null);
    
    const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);

    // Initialize the session manager once
    useEffect(() => {
        if (!sessionManagerRef.current) {
            sessionManagerRef.current = new LiveSessionManager({ dispatch });
        }
        // Check for screen share support - STRICT CHECK for mobile compatibility
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
            setIsScreenShareSupported(true);
        }
    }, [dispatch]);

    // Network monitoring effect
    useEffect(() => {
        const connection = (navigator as any).connection;
        if (!connection) return;
        const updateStatus = () => dispatch({ type: 'SET_NETWORK_STATUS', payload: getRealNetworkStatus() });
        updateStatus();
        connection.addEventListener('change', updateStatus);
        return () => connection.removeEventListener('change', updateStatus);
    }, [dispatch]);
    
    // Save interrupted session effect
    useEffect(() => {
        if (isListening && transcriptHistory.length > 0) {
            sessionStorage.setItem('interruptedSession', JSON.stringify(transcriptHistory));
        }
    }, [transcriptHistory, isListening]);


    const startSession = useCallback(async (config: StartSessionConfig) => {
        const options = {
            sourceLanguage, targetLanguage, voice, isVisionEnabled,
            semanticMemory, networkStatus, documentContent, volume,
            userFaceDescription, missionTasks, isCoachingMode, isStealthMode
        };
        await sessionManagerRef.current?.start(config, options, videoRef, canvasRef);
    }, [sourceLanguage, targetLanguage, voice, isVisionEnabled, semanticMemory, networkStatus, documentContent, volume, userFaceDescription, missionTasks, isCoachingMode, isStealthMode]);

    const stopSession = useCallback(async (saveHistory = true) => {
        await sessionManagerRef.current?.stop(saveHistory);
        dispatch({ type: 'SET_UI_STATE', payload: { isScreenSharing: false } }); // Reset screen share state on stop

        if (saveHistory && transcriptHistory.length > 0) {
            const newSession: ConversationSession = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                turns: [...transcriptHistory],
            };
            const updatedHistory = [newSession, ...conversationHistory];
            const newMemory = await extractSemanticMemory(transcriptHistory);
            
            // Dispatch updates state and triggers reducer side-effects for persistence
            dispatch({ type: 'SESSION_STOPPED', payload: { newHistory: updatedHistory, newMemory } });
            
        } else if (isListening) { 
             dispatch({ type: 'SESSION_CLEANUP' });
        }
    }, [conversationHistory, transcriptHistory, dispatch, isListening]);

    const sendTextMessage = useCallback((message: string) => {
        sessionManagerRef.current?.sendTextMessage(message);
    }, []);
    
    const handleToggleScreenShare = useCallback(async () => {
        if (!isListening || !videoRef.current) return;

        // Check if screen sharing is supported (often missing on mobile)
        if (!isScreenShareSupported) {
            dispatch({ type: 'SET_ERROR', payload: "Screen sharing is not supported on this device." });
            return;
        }

        try {
            if (isScreenSharing) {
                // Stop sharing: Restore Camera
                const stream = sessionManagerRef.current?.getMediaStream();
                if (stream) {
                    videoRef.current.srcObject = stream;
                    dispatch({ type: 'SET_UI_STATE', payload: { isScreenSharing: false } });
                } else {
                     dispatch({ type: 'SET_UI_STATE', payload: { isScreenSharing: false } });
                }
            } else {
                // Start sharing: Get Display Media
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" } as any,
                    audio: false // We want to keep the mic audio from the main session
                });
                
                videoRef.current.srcObject = screenStream;
                dispatch({ type: 'SET_UI_STATE', payload: { isScreenSharing: true } });

                // Handle user stopping share via browser UI
                screenStream.getVideoTracks()[0].onended = () => {
                     if (sessionManagerRef.current) {
                         const cameraStream = sessionManagerRef.current.getMediaStream();
                         if (videoRef.current && cameraStream) {
                             videoRef.current.srcObject = cameraStream;
                         }
                     }
                     dispatch({ type: 'SET_UI_STATE', payload: { isScreenSharing: false } });
                };
            }
        } catch (e) {
            console.error("Error toggling screen share:", e);
            dispatch({ type: 'SET_ERROR', payload: "Failed to toggle screen share." });
            dispatch({ type: 'SET_UI_STATE', payload: { isScreenSharing: false } });
        }

    }, [isListening, isScreenSharing, dispatch, isScreenShareSupported]);


    const handleFileUpload = (content: string, filename: string) => {
        try {
            let docData: DocumentData;
            if (filename.toLowerCase().endsWith('.csv')) {
                const lines = content.split('\n').filter(line => line.trim() !== '');
                if (lines.length > 0) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
                    docData = { headers, rows };
                } else {
                    throw new Error("Empty CSV file");
                }
            } else {
                const headers = ['Content'];
                const rows = content.split('\n').map(line => [line]);
                docData = { headers, rows };
            }
            dispatch({ type: 'SET_DOCUMENT', payload: { content: docData, name: filename } });
            dispatch({ type: 'SET_ERROR', payload: null });
        } catch (e) {
            console.error("Failed to parse document:", e);
            dispatch({ type: 'SET_ERROR', payload: "Could not parse the uploaded document." });
            dispatch({ type: 'SET_DOCUMENT', payload: { content: null, name: null } });
        }
    };
    
    const handleLegacyFolderLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            try {
                const virtualHandle = createVirtualFileSystem(e.target.files);
                sessionManagerRef.current?.setDirectoryHandle(virtualHandle);
                dispatch({ type: 'SET_PROJECT_NAME', payload: virtualHandle.name });
                dispatch({ type: 'SET_ERROR', payload: null });
            } catch (err) {
                console.error("Failed to create virtual file system", err);
                dispatch({ type: 'SET_ERROR', payload: "Failed to parse folder structure." });
            }
        }
    };

    const handleLoadProject = useCallback(async () => {
        try {
            // Check if API is supported
            if (!('showDirectoryPicker' in window)) {
                 throw new Error("FileSystemAccessAPINotSupported");
            }
            
            // @ts-ignore - showDirectoryPicker is not yet in standard lib dom types for all envs
            const handle = await window.showDirectoryPicker();
            sessionManagerRef.current?.setDirectoryHandle(handle);
            dispatch({ type: 'SET_PROJECT_NAME', payload: handle.name });
            dispatch({ type: 'SET_ERROR', payload: null });
        } catch (e: any) {
            if (e.name === 'AbortError') return; // User cancelled

            console.error("Project load failed (Native API):", e);
            
            // If blocked (e.g. iframe), fall back to legacy input
            if (e.message?.includes('Cross origin sub frames') || e.name === 'SecurityError' || e.message === 'FileSystemAccessAPINotSupported') {
                console.log("Falling back to legacy input mechanism...");
                // Trigger the hidden legacy input
                if (legacyInputRef.current) {
                    legacyInputRef.current.click();
                } else {
                     dispatch({ type: 'SET_ERROR', payload: "File System Access blocked and fallback unavailable." });
                }
            } else {
                dispatch({ type: 'SET_ERROR', payload: "Failed to load project directory." });
            }
        }
    }, [dispatch]);
    
    const handleClearHistory = useCallback(() => {
        if (window.confirm("Are you sure you want to delete all conversation history? This action cannot be undone.")) {
            dispatch({ type: 'CLEAR_ALL_HISTORY' });
            secureStorage.removeItem('translationHistory');
            secureStorage.removeItem('semanticMemory');
            secureStorage.removeItem('missionTasks');
        }
    }, [dispatch]);
    
    // Volume control effect
    useEffect(() => {
        sessionManagerRef.current?.setVolume(volume);
    }, [volume]);

    return {
        videoRef,
        canvasRef,
        legacyInputRef,
        startSession,
        stopSession,
        sendTextMessage,
        handleFileUpload,
        handleClearHistory,
        handleToggleScreenShare, 
        handleLoadProject,
        handleLegacyFolderLoad,
        isScreenShareSupported,
    };
};
