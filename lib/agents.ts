
import { DocumentData, SecurityStatus, MotionStatus } from "../types";
import { secureStorage } from "./security";
import { WalletState } from "./financial/wallet";

// --- Shared Agent Interfaces ---

export interface AgentContext {
    documentContent: DocumentData | null;
    directoryHandle: any | null;
    clientHooks: {
        captureScreen: (filename: string) => Promise<string>;
        copyToClipboard: (text: string) => Promise<string>;
        scanVisualCodes: () => Promise<string[]>; 
        setCoachingTip: (tip: any) => void;
        refreshWallet?: (wallet: WalletState) => void; // New Hook
    };
    systemStatus: {
        isOnline: boolean;
        isVisionEnabled: boolean;
        securityStatus: SecurityStatus;
        networkStatus: string;
        motionStatus: MotionStatus;
        location: { latitude: number, longitude: number } | null;
        isCoachingMode: boolean;
    };
    githubConfig?: { 
        token: string | null; 
        repo: string | null; 
    };
}

// --- Micro-Agents ---

export const TraderAgent = {
    name: 'TRADER',
    getTechnicalAnalysis: async (symbol: string) => {
        return `[TRADER] Analyzing ${symbol}...`;
    },
    generateChart: (title: string, type: string, data: any[]) => {
        return {
            agent: 'TRADER',
            action: 'Visualized Market Data',
            result: `Chart "${title}" rendered.`
        };
    }
};

export const EngineerAgent = {
    name: 'ENGINEER',
    readFile: async (path: string, handle: any) => {
        if (!handle) throw new Error("No file system mounted.");
        return `[ENGINEER] Reading ${path}`;
    },
    saveFile: async (filename: string, content: string, hooks: any) => {
        return `[ENGINEER] Writing code to ${filename}`;
    }
};

export const NavigatorAgent = {
    name: 'NAVIGATOR',
    checkWeather: async (lat: number, lon: number) => {
        return `[NAVIGATOR] Checking atmospheric sensors at ${lat}, ${lon}`;
    },
    browse: async (url: string) => {
        return `[NAVIGATOR] Opening portal to ${url}`;
    }
};

export const SentinelAgent = {
    name: 'SENTINEL',
    verifyIdentity: async (match: boolean) => {
        return match ? "IDENTITY_CONFIRMED" : "IDENTITY_REJECTED";
    },
    getDiagnostics: async (status: any) => {
        return `[SENTINEL] System Health: ${status.networkStatus} | Motion: ${status.motionStatus}`;
    }
};

export const DirectorAgent = {
    name: 'DIRECTOR',
    createConcept: async (idea: string) => {
        return `[DIRECTOR] Developing narrative for: "${idea}"`;
    },
    setFocusMode: (active: boolean) => {
        return active ? "FOCUS_MODE_ENGAGED" : "FOCUS_MODE_DISENGAGED";
    }
};

export const CoachAgent = {
    name: 'COACH',
    provideTip: (tip: string, severity: string) => {
        return `[COACH] [${severity.toUpperCase()}] ${tip}`;
    }
};

// --- Snapshot Manager (System Agent) ---

export const SystemAgent = {
    name: 'SYSTEM',
    createSnapshot: async () => {
        const history = await secureStorage.getItem('translationHistory');
        const memory = await secureStorage.getItem('semanticMemory');
        const tasks = await secureStorage.getItem('missionTasks');
        
        const snapshot = {
            timestamp: new Date().toISOString(),
            history,
            memory,
            tasks
        };
        
        return JSON.stringify(snapshot);
    },
    restoreSnapshot: async (json: string) => {
        try {
            const snapshot = JSON.parse(json);
            if (snapshot.history) await secureStorage.setItem('translationHistory', snapshot.history);
            if (snapshot.memory) await secureStorage.setItem('semanticMemory', snapshot.memory);
            if (snapshot.tasks) await secureStorage.setItem('missionTasks', snapshot.tasks);
            return true;
        } catch (e) {
            return false;
        }
    }
};
