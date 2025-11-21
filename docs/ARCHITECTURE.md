
# Issie OS Architecture Map

This document maps the "Sovereign Cognitive OS" vision to the actual codebase implementation.

## 1. The Cognitive Kernel (`services/LiveSessionManager.ts`)
The "Brainstem" of the OS. This service manages the persistent WebSocket connection to the model.
- **Function**: Handles the audio input/output loop (PCM 16kHz/24kHz).
- **Autonomy**: Manages the "Thinking" state and decides when to interrupt or listen.
- **Interoception**: Monitors network health (`resourceManager.ts`), Battery, and Motion sensors to adjust behavior.
- **Wake Lock**: Keeps the mobile device screen active during sessions.

## 2. The Vision Layer (`videoRef` & `Canvas`)
The "Visual Cortex" of the OS.
- **Input**: Captures raw video from the user's camera or screen share.
- **Processing**: Compresses frames to JPEG and streams them to the model.
- **Active Scans**: The model can trigger specific visual checks which force-analyzes the video feed for specific features (Biometric Lock).

## 3. The Action Layer (`lib/ToolExecutor.ts`)
The "Hands" of the OS. This layer translates AI intent into device execution without a backend.
- **Client Hooks**: We inject direct DOM capabilities into the tool executor:
    - `clientHooks.captureScreen` -> Triggers canvas-to-blob download.
    - `clientHooks.copyToClipboard` -> Writes to `navigator.clipboard`.
    - `clientHooks.openUrl` -> Controls `window.open`.
- **File System Access API**:
    - `directoryHandle` -> Allows the AI to read/write files on the host machine directly.
- **Haptic Engine**: Triggers device vibration on tool success/failure.

## 4. Micro-Agent Swarm (`lib/agents.ts`)
The OS logic is split into specialized modules:
- **Trader**: Technical Analysis, Charting.
- **Engineer**: File I/O, Code Patching, System Ops.
- **Navigator**: Web, Weather, Calendar, Battery.
- **Director**: Creative concepts, Audio control.
- **Sentinel**: Biometrics, System Status.
- **System**: Snapshots, Backups.
- **Coach**: Real-time advice.

## 5. Sovereign Security Layer (`lib/security.ts`)
- **Encryption**: Uses `AES-GCM` (256-bit) to encrypt semantic memory and conversation history before saving to `localStorage`.
- **Audit Log**: Maintains an immutable, hash-chained log of every agent action for self-auditing (`AuditLogViewer`).
- **Biometrics**: Uses semantic verification (Text-to-Visual & Audio Comparison) rather than storing raw vectors.

## 6. The Memory System ("Device-as-Memory")
Issie operates on a **Local-First** philosophy.
- **Semantic Memory**: Long-term preferences and facts are extracted and stored securely.
- **Mission Log**: Persistent task tracking across sessions.
- **Context Mounting**: Users manually "mount" directories, giving the OS temporary read/write access to specific knowledge bases.

## 7. Hybrid Neural Engine (`lib/nano.ts`)
Interfaces with the Chrome Built-in AI API (`window.ai`) to run **Gemini Nano** locally.
- **Function**: Handles offline summarization and low-latency text generation.
- **Privacy**: Ensures memory consolidation happens on-device without API calls.
