
import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { AppState, Action, AppContextType, SemanticMemory } from '../types';

const initialState: AppState = {
    sourceLanguage: 'auto',
    targetLanguage: 'en-US',
    voice: 'Kore',
    volume: 1,
    isVisionEnabled: true,
    isHistoryOpen: false,
    isDocsOpen: false,
    cameraFacingMode: 'user',
    textInput: '',
    isListening: false,
    isConnecting: false,
    isFlippingCamera: false,
    isScreenSharing: false, // Initialize screen sharing state
    error: null,
    userTranscript: '',
    assistantTranscript: '',
    transcriptHistory: [],
    conversationHistory: [],
    currentEmotion: null,
    semanticMemory: null,
    documentContent: null,
    documentName: null,
    projectName: null, // Added
    networkStatus: 'Optimal',
    isOnline: true,
    interruptedSession: null,
    toolCallStatus: null,
    userLocation: null,
    groundingChunks: null,
    securityStatus: 'open',
    userFaceDescription: null,
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_UI_STATE':
            return { ...state, ...action.payload };
        case 'START_CONNECTING':
            return { ...state, isConnecting: true, error: null };
        case 'SESSION_STARTED':
            // Reset to locked state if a face is registered
            return { 
                ...state, 
                isConnecting: false, 
                isListening: true, 
                transcriptHistory: [], 
                userTranscript: '', 
                assistantTranscript: '',
                isScreenSharing: false,
                securityStatus: state.userFaceDescription ? 'locked' : 'open'
            };
        case 'SESSION_STOPPED':
            // Persist updated memory to localStorage
            if (action.payload.newMemory) {
                localStorage.setItem('semanticMemory', JSON.stringify(action.payload.newMemory));
            }
            return {
                ...state,
                isListening: false,
                isConnecting: false,
                isScreenSharing: false,
                conversationHistory: action.payload.newHistory,
                semanticMemory: action.payload.newMemory ?? state.semanticMemory,
                securityStatus: state.userFaceDescription ? 'locked' : 'open' // Reset security on stop
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
                securityStatus: state.userFaceDescription ? 'locked' : 'open'
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
            return { ...state, conversationHistory: [], semanticMemory: null };
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
            localStorage.setItem('semanticMemory', JSON.stringify(updatedMemory));
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
                localStorage.removeItem('userFaceDescription');
            } else {
                localStorage.setItem('userFaceDescription', action.payload);
            }
            return { 
                ...state, 
                userFaceDescription: action.payload,
                securityStatus: action.payload ? 'locked' : 'open' 
            };
        default:
            return state;
    }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
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
