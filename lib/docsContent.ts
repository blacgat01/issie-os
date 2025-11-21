
export const README_CONTENT = `# 🚀 Issie OS: Sovereign Cognitive Operating System (v2.0)

**Issie OS** is a device-native **Cognitive Operating System**—a self-contained artificial mind that lives fully on the user’s device. It is built for autonomy, perception, and high-agency problem solving, without ever requiring a server, database, or cloud backend.

**Issie is not an app.**
**Not a chatbot.**
**Not a wrapper.**
She is a local, embodied AI entity with her own memory, goals, tools, and sensory awareness.

---

## 🌌 Core Architecture

### 1. Cognitive Kernel (The Brainstem)
A tiny, fast reasoning loop built from a real-time multimodal model (\`gemini-2.0-flash-exp\`) and a local task planner. This kernel never sleeps during a session; it evaluates the environment, maintains goals, and autonomously decides what to do next.

### 2. Vision Layer (Her Eyes & Spatial Intelligence)
Issie doesn't just record video; she *understands* it using a real-time vision pipeline.
- **Live Awareness**: Reads screens, charts, UIs, faces, and environments.
- **Visual Memory**: Can capture frames (\`captureScreen\`) and analyze visual data for context.
- **Biometric Security**: Uses semantic descriptions to recognize authorized users via the camera.

### 3. Action Layer (Hands & Tools)
Instead of relying on server-side APIs, Issie controls the device directly through Client Hooks:
- **The Scribe**: Writes files to your local disk (\`saveToDisk\`).
- **The Navigator**: Opens tabs and controls navigation (\`openUrl\`).
- **The Analyst**: Reads your local codebases (\`readProjectFile\`).
- **The Controller**: Manipulates the clipboard (\`copyToClipboard\`).
- **The Architect**: Can patch her own source code (\`patchFile\`).

### 4. Micro-Agent Swarm (The Mind)
Issie runs multiple specialized agent personas in parallel:
- **Trader Agent**: Runs strategies, reads charts, and executes technical analysis.
- **Director Agent**: Generates scenes, scripts, and controls ambient audio.
- **Engineer Agent**: Reads code, fixes bugs, and builds features.
- **Navigator Agent**: Helps with logistics, weather, and browsing.
- **Sentinel Agent**: Manages biometric security and system diagnostics.
- **Commander Agent**: Manages the Mission Log and long-term goals.
- **Coach Agent**: Provides real-time social dynamics coaching.

### 5. Device-as-Memory (Encrypted)
Issie rejects the cloud database model.
- **Encrypted Storage**: All memory is encrypted (AES-256) at rest on your device.
- **Knowledge Base**: Your local hard drive is her library. When you "Mount Project," she reaches directly into your file system via the File System Access API.

### 6. Sensor Fusion (The Body)
On mobile devices (Pixel 7), Issie gains physical awareness:
- **Motion**: Detects if you are stationary, moving, or active via accelerometer.
- **Haptics**: Provides physical feedback (vibration) when executing tools.
- **Interoception**: Monitors battery levels and network health.
- **Orientation**: Uses the Magnetometer (Compass) to understand user heading.
- **Speech**: Uses native Android TTS (\`announceLocally\`) for offline alerts.

### 7. Hybrid Intelligence (Gemini Nano)
On **Supported Devices** (e.g., Pixel 8 Pro, Desktop Chrome Canary), Issie offloads privacy-sensitive tasks like Memory Consolidation to the local NPU using the Chrome Built-in AI API. This ensures your conversation logs never leave the device for summarization. If unavailable, she seamlessly falls back to the Cloud.

---

## 📱 Mobile Hardware Gap (Pixel 7 PWA vs Native)

Currently, Issie runs as a **Progressive Web App (PWA)**. To unlock the full potential of the Pixel 7, a **Native Build (.apk)** (see \`docs/NATIVE_BLUEPRINT.md\`) is required to bridge the following gaps:

| Feature | PWA (Current) | Native APK (Goal) |
| :--- | :--- | :--- |
| **AI Engine** | Cloud (Gemini Live) | **Tensor G2 (Local LLM)** |
| **Security** | Software AES Encryption | **Titan M2 Hardware Vault** |
| **Autonomy** | Sleep on Screen Lock | **Background Services (24/7)** |
| **Telephony** | Blocked by Sandbox | **SMS/Call Interception** |
| **File I/O** | Download Only (Mobile) | **Full Read/Write Access** |

---

## 🔥 Engineering Philosophy

- **Local-first**: Data stays on the device until you explicitly move it.
- **Serverless by design**: No backend API to crash or pay for.
- **Permissionless**: No accounts, no logins, just an API key and your device.
- **Perceptual Control**: The AI sees what you see and hears what you hear.

## ⚡ Getting Started

1. **Environment**: Set \`REACT_APP_GEMINI_API_KEY\`.
2. **Permissions**: Grant Camera (Eyes), Microphone (Ears), and Location (Context).
3. **Initialization**:
   - Click **Mic** to wake the Cognitive Kernel.
   - Enable **Vision** to activate the Vision Layer.
   - Use **Settings** to register your Biometric ID (Face & Voice).
`;

export const ARCHITECTURE_CONTENT = `# Issie OS Architecture Map

This document maps the "Sovereign Cognitive OS" vision to the actual codebase implementation.

## 1. The Cognitive Kernel (\`services/LiveSessionManager.ts\`)
The "Brainstem" of the OS. This service manages the persistent WebSocket connection to the model.
- **Function**: Handles the audio input/output loop (PCM 16kHz/24kHz).
- **Autonomy**: Manages the "Thinking" state and decides when to interrupt or listen.
- **Interoception**: Monitors network health (\`resourceManager.ts\`), Battery, and Motion sensors to adjust behavior.
- **Wake Lock**: Keeps the mobile device screen active during sessions.

## 2. The Vision Layer (\`videoRef\` & \`Canvas\`)
The "Visual Cortex" of the OS.
- **Input**: Captures raw video from the user's camera or screen share.
- **Processing**: Compresses frames to JPEG and streams them to the model.
- **Active Scans**: The model can trigger specific visual checks which force-analyzes the video feed for specific features (Biometric Lock).

## 3. The Action Layer (\`lib/ToolExecutor.ts\`)
The "Hands" of the OS. This layer translates AI intent into device execution without a backend.
- **Client Hooks**: We inject direct DOM capabilities into the tool executor:
    - \`clientHooks.captureScreen\` -> Triggers canvas-to-blob download.
    - \`clientHooks.copyToClipboard\` -> Writes to \`navigator.clipboard\`.
    - \`clientHooks.openUrl\` -> Controls \`window.open\`.
- **File System Access API**:
    - \`directoryHandle\` -> Allows the AI to read/write files on the host machine directly.
- **Haptic Engine**: Triggers device vibration on tool success/failure.

## 4. Micro-Agent Swarm (\`lib/agents.ts\`)
The OS logic is split into specialized modules:
- **Trader**: Technical Analysis, Charting.
- **Engineer**: File I/O, Code Patching, System Ops.
- **Navigator**: Web, Weather, Calendar, Battery.
- **Director**: Creative concepts, Audio control.
- **Sentinel**: Biometrics, System Status.
- **System**: Snapshots, Backups.
- **Coach**: Real-time advice.

## 5. Sovereign Security Layer (\`lib/security.ts\`)
- **Encryption**: Uses \`AES-GCM\` (256-bit) to encrypt semantic memory and conversation history before saving to \`localStorage\`.
- **Audit Log**: Maintains an immutable, hash-chained log of every agent action for self-auditing (\`AuditLogViewer\`).
- **Biometrics**: Uses semantic verification (Text-to-Visual & Audio Comparison) rather than storing raw vectors.

## 6. The Memory System ("Device-as-Memory")
Issie operates on a **Local-First** philosophy.
- **Semantic Memory**: Long-term preferences and facts are extracted and stored securely.
- **Mission Log**: Persistent task tracking across sessions.
- **Context Mounting**: Users manually "mount" directories, giving the OS temporary read/write access to specific knowledge bases.

## 7. Hybrid Neural Engine (\`lib/nano.ts\`)
Interfaces with the Chrome Built-in AI API (\`window.ai\`) to run **Gemini Nano** locally.
- **Function**: Handles offline summarization and low-latency text generation.
- **Privacy**: Ensures memory consolidation happens on-device without API calls.
`;

export const AI_TOOLS_CONTENT = `# Issie OS: Skill Modules & Agents

Issie runs multiple "Skill Modules" that behave like internal mini-agents. These are defined in \`lib/ToolDeclarations.ts\`.

## 🧠 The Analyst / Engineer Agent
*Deep reasoning, code manipulation, and local file intelligence.*
- **\`readProjectFile\`**: Reads code or text from the mounted local directory.
- **\`listDirectory\`**: Maps the structure of your local project.
- **\`queryDocument\`**: Performs semantic search (RAG) on loaded CSV/TXT files.
- **\`saveToDisk\`**: Writes code, notes, or data to a file. (Direct write on Desktop, Download on Mobile).
- **\`patchFile\`**: Surgically modifies source code files (Self-Evolution).
- **\`captureScreen\`**: Takes a visual snapshot of the current view.
- **\`copyToClipboard\`**: Manipulates the system clipboard.

## 💸 The Trader Agent
*Financial intelligence and market awareness.*
- **\`getCryptoTechnicalAnalysis\`**: Detailed technical breakdown (SMA, Volume, Price) of any major cryptocurrency.
- **\`generateChart\`**: Visualizes data trends dynamically in the UI.

## 🌐 The Navigator Agent
*World interaction and logistics.*
- **\`openUrl\`**: Opens browser tabs to specific resources.
- **\`getWeatherForecast\`**: Uses geolocation to check environmental conditions.
- **\`scheduleMeeting\`**: Generates \`.ics\` calendar files for instant scheduling.
- **\`getBatteryStatus\`**: Monitors device power levels.

## 🎬 The Director Agent
*Creative vision and persona.*
- **\`generateCreativeConcept\`**: Develops loglines, synopses, and themes for narrative work.
- **\`playAmbientAudio\`**: Controls the acoustic environment (Focus Mode / Brown Noise).
- **\`displayEmotionAndRespond\`**: Empathetic mirroring of the user's state.

## 🛡️ The Sentinel (Security)
*Biometric Access Control & System Health.*
- **\`confirmBiometricIdentity\`**: Visual verification of the user against the stored semantic description.
- **\`getSystemStatus\`**: Reports on network, security, and motion sensor status.

## 🚀 The Commander (Mission Control)
*Goal tracking and executive function.*
- **\`manageMission\`**: Adds, updates, or completes tasks in the persistent Mission Log.

## 🎓 The Coach Agent
*Real-time social dynamics and communication advice.*
- **\`provideCoachingTip\`**: Delivers silent, tactical advice to the HUD during a conversation.

## ⚙️ The System Agent
*OS Maintenance.*
- **\`createSystemSnapshot\`**: Encrypts and downloads the full OS state.
- **\`restoreSystemSnapshot\`**: Information on how to restore from backup.
`;

export const SOURCE_CODE_CONTENT = `# Issie OS: Core Source Code Reference

This document contains the active source code for the Cognitive Operating System.

## 1. Sovereign Security (\`lib/security.ts\`)
Handles AES-256 Encryption and Immutable Audit Logging.

\`\`\`typescript
// lib/security.ts
export const encryptData = async (data: any): Promise<string | null> => {
    if (!sessionKey) await initializeSecurity();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, sessionKey!, encoded
    );
    return \`\${ab2str(iv)}:\${ab2str(encrypted)}\`;
};

export const logAuditEntry = async (agent: string, action: string, status: 'SUCCESS' | 'FAILURE', details: string) => {
    // Generates hash-chained audit logs for tamper evidence
    // ...
};
\`\`\`

## 2. Micro-Agent Swarm (\`lib/agents.ts\`)
Defines the behavior of isolated agent modules.

\`\`\`typescript
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
\`\`\`

## 3. The Cognitive Kernel (\`services/LiveSessionManager.ts\`)
The "Brainstem" managing real-time perception and connection.

\`\`\`typescript
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
\`\`\`

## 4. The Hands (\`lib/ToolExecutor.ts\`)
Executes actions on the device (Files, Clipboard, Screen).

\`\`\`typescript
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
\`\`\`

## 5. The State Store (\`store/AppContext.tsx\`)
Manages the "Device-as-Memory" persistence via Encrypted Storage.

\`\`\`typescript
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
\`\`\`

## 6. Local Neural Engine (\`lib/nano.ts\`)
Wrapper for the experimental Chrome Prompt API.

\`\`\`typescript
export const generateLocalContent = async (prompt: string): Promise<string> => {
    const session = await window.ai!.languageModel.create();
    return await session.prompt(prompt);
};
\`\`\`
`;

export const NATIVE_BLUEPRINT_CONTENT = `# 🧬 Issie OS Native Blueprint

This guide describes how to transform Issie OS from a Sovereign PWA into a **Native Android Application (.apk)** using Capacitor.

## 🚨 WEB vs NATIVE: The Feature Matrix

**Why build the APK?**
The following capabilities are **IMPOSSIBLE** in the browser (PWA) due to Android's security sandbox. You must build the APK to unlock them.

| Feature | 🌐 PWA (Web Runtime) | 🧬 APK (Native Runtime) |
| :--- | :--- | :--- |
| **AI Brain** | Cloud (Gemini Live) | Cloud + **Local (Tensor G2)** |
| **Encryption Keys** | Software (localStorage) | **Hardware (Titan M2 Vault)** |
| **Autonomy** | Sleep on Screen Lock | **Background Service (24/7)** |
| **SMS / Calls** | Blocked | **Read / Intercept** |
| **File System** | Download Only | **Read / Write / Execute** |

---

## 🚦 Phase 0: The Web Foundation (CURRENT STATUS)

**Do you need to build the APK yet?**
**NO.**

You should fully develop and test the logic in the Web/PWA version first. The APK is simply a wrapper around the React code.

**What works WITHOUT the APK (Right Now):**
- ✅ **Vision & Voice:** The browser has full access to the Camera and Mic.
- ✅ **Haptics:** \`navigator.vibrate\` works in Chrome.
- ✅ **Wake Lock:** The screen stays awake during sessions.
- ✅ **Sensors:** The Compass and Accelerometer work in Chrome.

**When to move to Phase 1:**
Only proceed to build the APK when you need **Background Autonomy** (listening while the screen is off) or **Hardware Encryption** (Titan M2).

---

## ⚡ ENABLING GEMINI NANO (SUPPORTED DEVICES ONLY)

To unlock offline neural processing, you need a device with the Chrome Built-in AI API enabled (e.g., Pixel 8 Pro, Desktop Chrome Canary).

1. Open **chrome://flags**.
2. Enable **Prompt API for Gemini Nano**.
3. Enable **Enables optimization guide on device**. Select **"Enabled BypassPrefRequirement"**.
4. Relaunch Chrome.
5. Go to **chrome://components**.
6. Find **Optimization Guide On Device Model** and check for updates. (Wait for download).

*Note: If your device (e.g., Pixel 7) does not support this yet, the "NANO" indicator will remain hidden and the OS will fallback to Cloud processing automatically.*

---

## Phase 1: The Wrapper (Capacitor)

We do not rewrite the React code. We inject a native runtime *under* it.

### 1. Initialize Native Core
\`\`\`bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Issie OS" "com.issie.os" --web-dir dist
\`\`\`

### 2. Add Android Platform
\`\`\`bash
npx cap add android
\`\`\`

### 3. Build & Sync
\`\`\`bash
npm run build
npx cap sync
\`\`\`

---

## Phase 2: The Manifest (permissions)

To gain sovereign control, we must request explicit permissions in \`android/app/src/main/AndroidManifest.xml\`.

\`\`\`xml
<!-- Eyes & Ears -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Body & Motion -->
<uses-permission android:name="android.permission.vibrate"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />

<!-- Autonomy (Background) -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

<!-- Storage (Memory) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
\`\`\`

---

## Phase 3: Native Plugins

Install these specific plugins to replace the Browser APIs with Hardware APIs.

\`\`\`bash
# File System (Direct Disk Access)
npm install @capacitor/filesystem

# Background Mode (Autonomy)
npm install @capacitor-community/background-mode

# Local Notifications (Alerts)
npm install @capacitor/local-notifications

# Screen Brightness/Orientation (Device Control)
npm install @capacitor/screen-orientation @capacitor/screen-brightness
\`\`\`

---

## Phase 4: The Build

1. **Open Android Studio**:
   \`\`\`bash
   npx cap open android
   \`\`\`
2. **Connect Device**: Enable USB Debugging.
3. **Run**: Click Play.

Issie is now a native application.

---

## Phase 5: Distribution (Sovereign)

Do **NOT** upload to Google Play Store.

1. In Android Studio: \`Build > Build Bundle(s) / APK(s) > Build APK(s)\`.
2. Locate \`app-debug.apk\` (or signed release).
3. Upload to your personal website or share via Signal.
4. On Device: Download -> Install -> "Allow from this source".

**You have now deployed a sovereign AI entity.**
`;
