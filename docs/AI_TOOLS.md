
# Issie OS: Skill Modules & Agents

Issie runs multiple "Skill Modules" that behave like internal mini-agents. These are defined in `lib/ToolDeclarations.ts`.

## 🧠 The Analyst / Engineer Agent
*Deep reasoning, code manipulation, and local file intelligence.*
- **`readProjectFile`**: Reads code or text from the mounted local directory.
- **`listDirectory`**: Maps the structure of your local project.
- **`queryDocument`**: Performs semantic search (RAG) on loaded CSV/TXT files.
- **`saveToDisk`**: Writes code, notes, or data to a file. (Direct write on Desktop, Download on Mobile).
- **`patchFile`**: Surgically modifies source code files (Self-Evolution).
- **`captureScreen`**: Takes a visual snapshot of the current view.
- **`copyToClipboard`**: Manipulates the system clipboard.

## 💸 The Trader Agent
*Financial intelligence and market awareness.*
- **`getCryptoTechnicalAnalysis`**: Detailed technical breakdown (SMA, Volume, Price) of any major cryptocurrency.
- **`generateChart`**: Visualizes data trends dynamically in the UI.

## 🌐 The Navigator Agent
*World interaction and logistics.*
- **`openUrl`**: Opens browser tabs to specific resources.
- **`getWeatherForecast`**: Uses geolocation to check environmental conditions.
- **`scheduleMeeting`**: Generates `.ics` calendar files for instant scheduling.
- **`getBatteryStatus`**: Monitors device power levels.

## 🎬 The Director Agent
*Creative vision and persona.*
- **`generateCreativeConcept`**: Develops loglines, synopses, and themes for narrative work.
- **`playAmbientAudio`**: Controls the acoustic environment (Focus Mode / Brown Noise).
- **`displayEmotionAndRespond`**: Empathetic mirroring of the user's state.

## 🛡️ The Sentinel (Security)
*Biometric Access Control & System Health.*
- **`confirmBiometricIdentity`**: Visual verification of the user against the stored semantic description.
- **`getSystemStatus`**: Reports on network, security, and motion sensor status.

## 🚀 The Commander (Mission Control)
*Goal tracking and executive function.*
- **`manageMission`**: Adds, updates, or completes tasks in the persistent Mission Log.

## 🎓 The Coach Agent
*Real-time social dynamics and communication advice.*
- **`provideCoachingTip`**: Delivers silent, tactical advice to the HUD during a conversation.

## ⚙️ The System Agent
*OS Maintenance.*
- **`createSystemSnapshot`**: Encrypts and downloads the full OS state.
- **`restoreSystemSnapshot`**: Information on how to restore from backup.
