
# Issie OS: Core Source Code Reference

This document contains the active source code for the Cognitive Operating System.

## 1. Sovereign Security (`lib/security.ts`)
Handles AES-256 Encryption and Immutable Audit Logging.

```typescript
// lib/security.ts
export const encryptData = async (data: any): Promise<string | null> => {
    if (!sessionKey) await initializeSecurity();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, sessionKey!, encoded
    );
    return `${ab2str(iv)}:${ab2str(encrypted)}`;
};

export const logAuditEntry = async (agent: string, action: string, status: 'SUCCESS' | 'FAILURE', details: string) => {
    // Generates hash-chained audit logs for tamper evidence
    // ...
};
```

## 2. Micro-Agent Swarm (`lib/agents.ts`)
Defines the behavior of isolated agent modules.

```typescript
// lib/agents.ts
export const EngineerAgent = {
    name: 'ENGINEER',
    saveFile: async (filename: string, content: string, hooks: any) => {
        // Logic for file I/O
    }
};

export const SentinelAgent = {
    name: 'SENTINEL',
    verifyIdentity: async (match: boolean) => {
        return match ? "IDENTITY_CONFIRMED" : "IDENTITY_REJECTED";
    }
};
```

## 3. The Cognitive Kernel (`services/LiveSessionManager.ts`)
The "Brainstem" managing real-time perception and connection.

```typescript
// services/LiveSessionManager.ts (Partial)
export class LiveSessionManager {
    // ...
    async start(...) {
        // Request Mobile Wake Lock
        await this.requestWakeLock();
        
        // ...
        
        // FORCE TRIGGER: If security is active, inject system command
        if (options.userFaceDescription) {
            setTimeout(() => {
                this.sendSystemMessage("SYSTEM_TRIGGER: Analyze the video feed now...");
            }, 1500);
        }
    }
}
```

## 4. The Hands (`lib/ToolExecutor.ts`)
Executes actions on the device (Files, Clipboard, Screen).

```typescript
// lib/ToolExecutor.ts
export const executeToolCall = async (functionCall: FunctionCall, context: AgentContext): Promise<any> => {
  switch (name) {
    case 'saveToDisk':
       // Handles dual-mode writing (Direct Write vs Download Fallback)
       // ...
    case 'patchFile':
       // Surgical code modification
       // ...
  }
  // Logs every action to the immutable audit trail
  await logAuditEntry(agentName, name, status, result);
};
```

## 5. The State Store (`store/AppContext.tsx`)
Manages the "Device-as-Memory" persistence via Encrypted Storage.

```typescript
// store/AppContext.tsx
// Async initialization for secure storage
useEffect(() => {
    const init = async () => {
        await initializeSecurity();
        const savedData = await secureStorage.getItem('semanticMemory');
        // ...
    };
    init();
}, []);
```

## 6. Local Neural Engine (`lib/nano.ts`)
Wrapper for the experimental Chrome Prompt API.

```typescript
export const generateLocalContent = async (prompt: string): Promise<string> => {
    const session = await window.ai!.languageModel.create();
    return await session.prompt(prompt);
};
```
