
import React, { createContext, useReducer, useContext, ReactNode, useEffect, useState } from 'react';
import { AppState, Action, AppContextType, SemanticMemory, MissionTask } from '../types';
import { secureStorage, initializeSecurity } from '../lib/security';
import { getWallet } from '../lib/financial/wallet';

// We now need to handle async storage loading
const initialState: AppState = {
    sourceLanguage: 'auto',
    targetLanguage: 'en-US',
    voice: 'Kore',
    volume: 1,
    isVisionEnabled: true,
    isHistoryOpen: false,
    isDocsOpen: false,
    isCoachingMode: false,
    isStealthMode: false,
    cameraFacingMode: 'user',
    textInput: '',
    isListening: false,
    isConnecting: false,
    isFlippingCamera: false,
    isScreenSharing: false,
    error: null,
    userTranscript: '',
    assistantTranscript: '',
    transcriptHistory: [],
    conversationHistory: [],
    currentEmotion: null,
    semanticMemory: null,
    missionTasks: [],
    latestCoachingTip: null,
    documentContent: null,
    documentName: null,
    projectName: null,
    networkStatus: 'Optimal',
    isOnline: true,
    interruptedSession: null,
    toolCallStatus: null,
    userLocation: null,
    groundingChunks: null,
    securityStatus: 'open',
    userFaceDescription: null,
    userVoiceReference: null,
    motionStatus: 'Stationary',
    deviceHeading: null,
    lightLevel: null,
    notification: null,
    githubToken: null,
    githubRepo: null,
    paperWallet: null,
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_UI_STATE':
            return { ...state, ...action.payload };
        case 'START_CONNECTING':
            return { ...state, isConnecting: true, error: null };
        case 'SESSION_STARTED':
            return { 
                ...state, 
                isConnecting: false, 
                isListening: true, 
                transcriptHistory: [], 
                userTranscript: '', 
                assistantTranscript: '',
                isScreenSharing: false,
                securityStatus: (state.userFaceDescription || state.userVoiceReference) ? 'locked' : 'open'
            };
        case 'SESSION_STOPPED':
            if (action.payload.newMemory) {
                secureStorage.setItem('semanticMemory', action.payload.newMemory);
            }
            // Auto-save encrypted history for persistence
            secureStorage.setItem('translationHistory', action.payload.newHistory);
            
            return {
                ...state,
                isListening: false,
                isConnecting: false,
                isScreenSharing: false,
                conversationHistory: action.payload.newHistory,
                semanticMemory: action.payload.newMemory ?? state.semanticMemory,
                securityStatus: (state.userFaceDescription || state.userVoiceReference) ? 'locked' : 'open',
                latestCoachingTip: null
            };
        case 'SESSION_CLEANUP':
             return { 
                ...state, 
                isListening: false, 
                isConnecting: false, 
                isScreenSharing: false,
                userTranscript: '', 
                assistantTranscript: '', 
                currentEmotion: null, 
                error: null, 
                toolCallStatus: null, 
                groundingChunks: null,
                securityStatus: (state.userFaceDescription || state.userVoiceReference) ? 'locked' : 'open',
                latestCoachingTip: null
            };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isConnecting: false, isListening: false, isScreenSharing: false };
        case 'UPDATE_USER_TRANSCRIPT':
            return { ...state, userTranscript: action.payload };
        case 'UPDATE_ASSISTANT_TRANSCRIPT':
            return { ...state, assistantTranscript: action.payload, toolCallStatus: null };
        case 'SET_CURRENT_EMOTION':
            return { ...state, currentEmotion: action.payload };
        case 'ADD_TRANSCRIPT_TURN': {
            if (!action.payload.user.trim() && !action.payload.assistant.trim() && !action.payload.chartData) {
                return state;
            }
            return { ...state, transcriptHistory: [...state.transcriptHistory, action.payload] };
        }
        case 'UPDATE_LAST_ASSISTANT_TRANSCRIPT': {
             if (state.transcriptHistory.length === 0) return state;
             const newHistory = [...state.transcriptHistory];
             const lastTurn = newHistory[newHistory.length - 1];
             lastTurn.assistant = action.payload;
             return { ...state, transcriptHistory: newHistory };
        }
        case 'CLEAR_CURRENT_TURN':
            return { ...state, userTranscript: '', assistantTranscript: '', currentEmotion: null, toolCallStatus: null, groundingChunks: null };
        case 'SET_CONVERSATION_HISTORY':
            return { ...state, conversationHistory: action.payload };
        case 'SET_SEMANTIC_MEMORY':
            return { ...state, semanticMemory: action.payload };
        case 'CLEAR_ALL_HISTORY':
            return { ...state, conversationHistory: [], semanticMemory: null, missionTasks: [] };
        case 'SET_INTERRUPTED_SESSION':
            return { ...state, interruptedSession: action.payload };
        case 'SET_NETWORK_STATUS':
            return { ...state, networkStatus: action.payload };
        case 'SET_IS_ONLINE':
            return { ...state, isOnline: action.payload };
        case 'SET_DOCUMENT':
            return { ...state, documentContent: action.payload.content, documentName: action.payload.name };
        case 'SET_PROJECT_NAME':
            return { ...state, projectName: action.payload };
        case 'SET_TOOL_CALL':
            return { ...state, toolCallStatus: action.payload };
        case 'UPDATE_SEMANTIC_MEMORY': {
            const updatedMemory: SemanticMemory = state.semanticMemory 
                ? { ...state.semanticMemory, userPreferences: [...state.semanticMemory.userPreferences, action.payload.newPreference] }
                : { summary: '', keyEntities: [], userPreferences: [action.payload.newPreference] };
            secureStorage.setItem('semanticMemory', updatedMemory);
            return { ...state, semanticMemory: updatedMemory };
        }
        case 'SET_USER_LOCATION':
            return { ...state, userLocation: action.payload };
        case 'SET_GROUNDING_CHUNKS':
            return { ...state, groundingChunks: action.payload };
        case 'SET_SECURITY_STATUS':
            return { ...state, securityStatus: action.payload };
        case 'SET_USER_FACE_DESCRIPTION':
            if (action.payload === null) {
                secureStorage.removeItem('userFaceDescription');
            } else {
                secureStorage.setItem('userFaceDescription', action.payload);
            }
            return { 
                ...state, 
                userFaceDescription: action.payload,
                securityStatus: action.payload || state.userVoiceReference ? 'locked' : 'open' 
            };
        case 'SET_USER_VOICE_REFERENCE':
            if (action.payload === null) {
                secureStorage.removeItem('userVoiceReference');
            } else {
                secureStorage.setItem('userVoiceReference', action.payload);
            }
            return {
                ...state,
                userVoiceReference: action.payload,
                securityStatus: action.payload || state.userFaceDescription ? 'locked' : 'open'
            };
        case 'UPDATE_MISSION_TASKS':
            secureStorage.setItem('missionTasks', action.payload);
            return { ...state, missionTasks: action.payload };
        case 'SET_MOTION_STATUS':
            return { ...state, motionStatus: action.payload };
        case 'SET_DEVICE_HEADING':
            return { ...state, deviceHeading: action.payload };
        case 'SET_LIGHT_LEVEL':
            const isDark = action.payload !== null && action.payload < 10;
            return { ...state, lightLevel: action.payload, isStealthMode: isDark };
        case 'SET_COACHING_TIP':
            return { ...state, latestCoachingTip: action.payload };
        case 'SET_GITHUB_CONFIG':
            if (action.payload.token) secureStorage.setItem('githubToken', action.payload.token);
            if (action.payload.repo) secureStorage.setItem('githubRepo', action.payload.repo);
            return { ...state, githubToken: action.payload.token, githubRepo: action.payload.repo };
        case 'SET_PAPER_WALLET':
             return { ...state, paperWallet: action.payload };
        case 'SHOW_NOTIFICATION':
             return { ...state, notification: action.payload };
        case 'HIDE_NOTIFICATION':
             return { ...state, notification: null };
        default:
            return state;
    }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [isLoaded, setIsLoaded] = useState(false);

    // Async Initialization for Secure Storage
    useEffect(() => {
        const init = async () => {
            await initializeSecurity();
            
            const savedFace = await secureStorage.getItem('userFaceDescription');
            const savedVoice = await secureStorage.getItem('userVoiceReference');
            const savedEpisodic = await secureStorage.getItem('translationHistory');
            const savedSemantic = await secureStorage.getItem('semanticMemory');
            const savedTasks = await secureStorage.getItem('missionTasks');
            const savedGhToken = await secureStorage.getItem('githubToken');
            const savedGhRepo = await secureStorage.getItem('githubRepo');
            const wallet = await getWallet();

            if (savedFace) dispatch({ type: 'SET_USER_FACE_DESCRIPTION', payload: savedFace });
            if (savedVoice) dispatch({ type: 'SET_USER_VOICE_REFERENCE', payload: savedVoice });
            if (savedEpisodic) dispatch({ type: 'SET_CONVERSATION_HISTORY', payload: savedEpisodic });
            if (savedSemantic) dispatch({ type: 'SET_SEMANTIC_MEMORY', payload: savedSemantic });
            if (savedTasks) dispatch({ type: 'UPDATE_MISSION_TASKS', payload: savedTasks });
            if (savedGhToken || savedGhRepo) dispatch({ type: 'SET_GITHUB_CONFIG', payload: { token: savedGhToken, repo: savedGhRepo } });
            if (wallet) dispatch({ type: 'SET_PAPER_WALLET', payload: wallet });

            setIsLoaded(true);
        };
        init();
    }, []);

    if (!isLoaded) {
        return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-blue-400">Initializing Secure Sovereign Kernel...</div>;
    }

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
