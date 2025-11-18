# System Architecture

## Directory Structure

- **`components/`**: Reusable UI elements (Icons, TranscriptionDisplay, EmotionalMeter).
- **`hooks/`**: Custom React hooks.
  - `useCognitiveEngine.ts`: The bridge between the UI and the backend services.
- **`lib/`**: Core logic and helpers.
  - `systemInstructions.ts`: Prompt engineering logic.
  - `ToolExecutor.ts`: Implementation of agent tools.
  - `resourceManager.ts`: Network adaptation logic.
- **`services/`**: Singleton services.
  - `LiveSessionManager.ts`: Manages the WebSocket connection to Gemini.
- **`store/`**: State management.
  - `AppContext.tsx`: Global state (Auth, Transcripts, Settings).

## Core Components

### 1. The Cognitive Engine (`useCognitiveEngine` & `LiveSessionManager`)
The app does not use standard REST calls for interaction. Instead, it establishes a **Live Session** via WebSockets.
- **Audio Handling**: Raw PCM audio is captured at 16kHz and sent to the model. Model output (24kHz) is buffered and played back smoothly.
- **Video Handling**: Frames are captured from the video element, compressed to JPEG, and streamed to the model based on the adaptive frame rate (1fps - 5fps).

### 2. State Management (`AppContext`)
The app uses a centralized Reducer pattern.
- **UI State**: Input fields, modal visibility, toggle states.
- **Session State**: Transcripts (`transcriptHistory`), current emotion, connectivity status.
- **Data State**: Semantic memory, uploaded documents, user location.

### 3. Biometric Security Flow
The security system is "Semantic Biometrics"—it uses language models to describe and recognize faces rather than storing vector embeddings.
1. **Registration**: Captures image -> Gemini Flash -> Generates description (e.g., "User with short dark hair, glasses...").
2. **Storage**: Description stored in `localStorage` and loaded into `AppState`.
3. **Verification**:
   - Session starts.
   - `systemInstructions.ts` injects the description and security protocol.
   - Model "looks" at the camera.
   - Model calls tool `confirmBiometricIdentity({ match: true/false })`.
   - `LiveSessionManager` intercepts tool call and updates `securityStatus`.

### 4. Tool Execution Pipeline
1. Model decides to call a tool (e.g., `searchWeb`).
2. `LiveSessionManager` receives `toolCall` event.
3. UI displays "Using tool..." indicator.
4. `ToolExecutor` runs the logic (fetching API, parsing data).
5. Result sent back to Model via `session.sendToolResponse`.
6. Model generates natural language response based on tool output.
