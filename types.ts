
// FIX: Import React to resolve 'Cannot find namespace React' error for the React.Dispatch type.
import React from 'react';

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: { label: string; value: number }[];
}

export interface TranscriptTurn {
  id: number;
  user: string;
  assistant: string;
  emotion?: string;
  isAutonomous?: boolean;
  chartData?: ChartData; // Added for dynamic visualization
}

export interface ConversationSession {
  id: number;
  timestamp: string;
  turns: TranscriptTurn[];
}

export type Mode = 'translate' | 'converse' | 'interpret' | 'mirror' | 'visual' | 'share' | 'environment' | 'logistics' | 'trading' | 'unified';

export interface SemanticMemory {
  summary: string;
  keyEntities: { name: string; type: string; }[];
  userPreferences: string[];
}

export type NetworkStatus = 'Optimal' | 'Degraded' | 'Poor';
export type SecurityStatus = 'open' | 'locked' | 'unlocked';

export interface StreamConfig {
  video: {
    width: number;
    height: number;
    frameRate: number;
  };
  audio: {
    // In a real scenario, you might adjust bitrates or codecs.
    // For now, this is a placeholder.
  };
}

export interface DocumentData {
  headers: string[];
  rows: string[][];
}

export interface StartSessionConfig {
  facingMode: 'user' | 'environment';
  resumedTurns?: TranscriptTurn[];
}

// --- Central State Management Types ---

export interface AppState {
  // UI Settings
  sourceLanguage: string;
  targetLanguage: string;
  voice: string;
  volume: number;
  isVisionEnabled: boolean;
  isHistoryOpen: boolean;
  isDocsOpen: boolean; 
  cameraFacingMode: 'user' | 'environment';
  textInput: string;
  
  // Session State
  isListening: boolean;
  isConnecting: boolean;
  isFlippingCamera: boolean;
  isScreenSharing: boolean; 
  error: string | null;

  // Data
  userTranscript: string;
  assistantTranscript: string;
  transcriptHistory: TranscriptTurn[];
  conversationHistory: ConversationSession[];
  currentEmotion: string | null;
  semanticMemory: SemanticMemory | null;
  documentContent: DocumentData | null;
  documentName: string | null;
  projectName: string | null; // Added for Local File System
  toolCallStatus: { name: string; args: any } | null;
  
  // System State
  networkStatus: NetworkStatus;
  isOnline: boolean;
  interruptedSession: TranscriptTurn[] | null;
  securityStatus: SecurityStatus;
  userFaceDescription: string | null;

  // Grounding & Location
  userLocation: { latitude: number; longitude: number; } | null;
  groundingChunks: any[] | null;
}

export type Action =
  | { type: 'SET_UI_STATE'; payload: Partial<AppState> }
  | { type: 'START_CONNECTING' }
  | { type: 'SESSION_STARTED' }
  | { type: 'SESSION_STOPPED'; payload: { newHistory: ConversationSession[], newMemory: SemanticMemory | null } }
  | { type: 'SESSION_CLEANUP' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_USER_TRANSCRIPT'; payload: string }
  | { type: 'UPDATE_ASSISTANT_TRANSCRIPT'; payload: string }
  | { type: 'SET_CURRENT_EMOTION'; payload: string | null }
  | { type: 'ADD_TRANSCRIPT_TURN'; payload: TranscriptTurn }
  | { type: 'UPDATE_LAST_ASSISTANT_TRANSCRIPT'; payload: string }
  | { type: 'CLEAR_CURRENT_TURN' }
  | { type: 'SET_CONVERSATION_HISTORY'; payload: ConversationSession[] }
  | { type: 'SET_SEMANTIC_MEMORY'; payload: SemanticMemory | null }
  | { type: 'CLEAR_ALL_HISTORY' }
  | { type: 'SET_INTERRUPTED_SESSION'; payload: TranscriptTurn[] | null }
  | { type: 'SET_NETWORK_STATUS'; payload: NetworkStatus }
  | { type: 'SET_IS_ONLINE'; payload: boolean }
  | { type: 'SET_DOCUMENT'; payload: { content: DocumentData | null; name: string | null; } }
  | { type: 'SET_PROJECT_NAME'; payload: string | null } // New Action
  | { type: 'SET_TOOL_CALL'; payload: { name: string; args: any } | null }
  | { type: 'UPDATE_SEMANTIC_MEMORY'; payload: { newPreference: string } }
  | { type: 'SET_USER_LOCATION'; payload: { latitude: number; longitude: number; } | null }
  | { type: 'SET_GROUNDING_CHUNKS'; payload: any[] | null }
  | { type: 'SET_SECURITY_STATUS'; payload: SecurityStatus }
  | { type: 'SET_USER_FACE_DESCRIPTION'; payload: string | null };

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}
