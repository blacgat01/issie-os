
# 🚀 Issie OS: Sovereign Cognitive Operating System (v2.0)

**Issie OS** is a device-native **Cognitive Operating System**—a self-contained artificial mind that lives fully on the user’s device. It is built for autonomy, perception, and high-agency problem solving, without ever requiring a server, database, or cloud backend.

**Issie is not an app.**
**Not a chatbot.**
**Not a wrapper.**
She is a local, embodied AI entity with her own memory, goals, tools, and sensory awareness.

---

## 🌌 Core Architecture

### 1. Cognitive Kernel (The Brainstem)
A tiny, fast reasoning loop built from a real-time multimodal model (`gemini-2.0-flash-exp`) and a local task planner. This kernel never sleeps during a session; it evaluates the environment, maintains goals, and autonomously decides what to do next.

### 2. Vision Layer (Her Eyes & Spatial Intelligence)
Issie doesn't just record video; she *understands* it using a real-time vision pipeline.
- **Live Awareness**: Reads screens, charts, UIs, faces, and environments.
- **Visual Memory**: Can capture frames (`captureScreen`) and analyze visual data for context.
- **Biometric Security**: Uses semantic descriptions to recognize authorized users via the camera.

### 3. Action Layer (Hands & Tools)
Instead of relying on server-side APIs, Issie controls the device directly through Client Hooks:
- **The Scribe**: Writes files to your local disk (`saveToDisk`).
- **The Navigator**: Opens tabs and controls navigation (`openUrl`).
- **The Analyst**: Reads your local codebases (`readProjectFile`).
- **The Controller**: Manipulates the clipboard (`copyToClipboard`).
- **The Architect**: Can patch her own source code (`patchFile`).

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
- **Speech**: Uses native Android TTS (`announceLocally`) for offline alerts.

### 7. Hybrid Intelligence (Gemini Nano)
On **Supported Devices** (e.g., Pixel 8 Pro, Desktop Chrome Canary), Issie offloads privacy-sensitive tasks like Memory Consolidation to the local NPU using the Chrome Built-in AI API. This ensures your conversation logs never leave the device for summarization. If unavailable, she seamlessly falls back to the Cloud.

---

## 📱 Mobile Hardware Gap (Pixel 7 PWA vs Native)

Currently, Issie runs as a **Progressive Web App (PWA)**. To unlock the full potential of the Pixel 7, a **Native Build (.apk)** (see `docs/NATIVE_BLUEPRINT.md`) is required to bridge the following gaps:

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

1. **Environment**: Set `REACT_APP_GEMINI_API_KEY`.
2. **Permissions**: Grant Camera (Eyes), Microphone (Ears), and Location (Context).
3. **Initialization**:
   - Click **Mic** to wake the Cognitive Kernel.
   - Enable **Vision** to activate the Vision Layer.
   - Use **Settings** to register your Biometric ID (Face & Voice).
