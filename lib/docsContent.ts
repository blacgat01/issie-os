
export const README_CONTENT = `# Issie: Unified Cognitive Agent

## Overview
Issie is a next-generation real-time AI assistant built with React and the Google Gemini Multimodal Live API. Unlike traditional chatbots, Issie operates as a "Unified Cognitive Agent"—capable of seeing, hearing, and acting in the real world through a persistent, low-latency connection.

## Key Features

### 🧠 Multimodal Intelligence
- **Real-time Voice**: Fluid, interruptible voice conversations using Gemini 2.5 Live API.
- **Computer Vision**: Processes live video feed to understand environment, emotion, and context.
- **Biometric Security**: Features a novel "Face ID" system that uses Gemini to generate and verify textual descriptions of the authorized user.

### 🛠 Agentic Capabilities
- **Autonomous Tool Use**: Can browse the web, analyze financial markets (Crypto), and schedule meetings.
- **Memory**: Implements both episodic (session history) and semantic memory (long-term user preferences).
- **Grounding**: Uses Google Maps and Search for factual accuracy.

### ⚡ Performance
- **Adaptive Streaming**: "Digital Hypothalamus" module adjusts video/audio quality based on network conditions.
- **Resilience**: Auto-reconnection handling and session state recovery.

## Getting Started

1. **Environment**: Ensure \`REACT_APP_GEMINI_API_KEY\` is set in your environment.
2. **Permissions**: Allow access to Microphone, Camera, and Location when prompted.
3. **Interaction**:
   - Click the **Mic** button to start a session.
   - Enable **Vision** to let Issie see.
   - Use the **Settings** panel to register your face for security.

## Tech Stack
- **Frontend**: React 18, Tailwind CSS
- **AI SDK**: \`@google/genai\`
- **State Management**: React Context + Reducer
- **Audio**: Web Audio API (PCM processing)`;

export const ARCHITECTURE_CONTENT = `# System Architecture

## Directory Structure

- **\`components/\`**: Reusable UI elements (Icons, TranscriptionDisplay, EmotionalMeter).
- **\`hooks/\`**: Custom React hooks.
  - \`useCognitiveEngine.ts\`: The bridge between the UI and the backend services.
- **\`lib/\`**: Core logic and helpers.
  - \`systemInstructions.ts\`: Prompt engineering logic.
  - \`ToolExecutor.ts\`: Implementation of agent tools.
  - \`resourceManager.ts\`: Network adaptation logic.
- **\`services/\`**: Singleton services.
  - \`LiveSessionManager.ts\`: Manages the WebSocket connection to Gemini.
- **\`store/\`**: State management.
  - \`AppContext.tsx\`: Global state (Auth, Transcripts, Settings).

## Core Components

### 1. The Cognitive Engine (\`useCognitiveEngine\` & \`LiveSessionManager\`)
The app does not use standard REST calls for interaction. Instead, it establishes a **Live Session** via WebSockets.
- **Audio Handling**: Raw PCM audio is captured at 16kHz and sent to the model. Model output (24kHz) is buffered and played back smoothly.
- **Video Handling**: Frames are captured from the video element, compressed to JPEG, and streamed to the model based on the adaptive frame rate (1fps - 5fps).

### 2. State Management (\`AppContext\`)
The app uses a centralized Reducer pattern.
- **UI State**: Input fields, modal visibility, toggle states.
- **Session State**: Transcripts (\`transcriptHistory\`), current emotion, connectivity status.
- **Data State**: Semantic memory, uploaded documents, user location.

### 3. Biometric Security Flow
The security system is "Semantic Biometrics"—it uses language models to describe and recognize faces rather than storing vector embeddings.
1. **Registration**: Captures image -> Gemini Flash -> Generates description (e.g., "User with short dark hair, glasses...").
2. **Storage**: Description stored in \`localStorage\` and loaded into \`AppState\`.
3. **Verification**:
   - Session starts.
   - \`systemInstructions.ts\` injects the description and security protocol.
   - Model "looks" at the camera.
   - Model calls tool \`confirmBiometricIdentity({ match: true/false })\`.
   - \`LiveSessionManager\` intercepts tool call and updates \`securityStatus\`.

### 4. Tool Execution Pipeline
1. Model decides to call a tool (e.g., \`searchWeb\`).
2. \`LiveSessionManager\` receives \`toolCall\` event.
3. UI displays "Using tool..." indicator.
4. \`ToolExecutor\` runs the logic (fetching API, parsing data).
5. Result sent back to Model via \`session.sendToolResponse\`.
6. Model generates natural language response based on tool output.`;

export const AI_TOOLS_CONTENT = `# AI & Tooling Documentation

## Gemini Configuration

**Models Used:**
- **\`gemini-2.5-flash-native-audio-preview-09-2025\`**: Used for the main live conversation loop. Optimized for low latency and audio modalities.
- **\`gemini-2.5-flash\`**: Used for one-shot tasks like Face Registration and Semantic Memory extraction.

**System Prompts (\`lib/systemInstructions.ts\`):**
The system prompt is dynamic and re-assembled for every session. It includes:
1. **Core Identity**: "Issie", the executive assistant and partner.
2. **Security Protocol**: Instructions on how to handle the "Locked" state and when to verify identity.
3. **Context**: Current location, resumed conversation transcript, and semantic memory summaries.
4. **Capabilities**: Explicit instructions on when to use specific tools.

## Available Tools

Defined in \`lib/ToolDeclarations.ts\` and executed in \`lib/ToolExecutor.ts\`.

| Tool Name | Description | Implementation |
|-----------|-------------|----------------|
| **\`displayEmotionAndRespond\`** | Updates the UI emotion meter and provides an empathetic response. | Internal State Update |
| **\`confirmBiometricIdentity\`** | Unlocks/Locks the application based on visual match. | Internal State Update |
| **\`searchWeb\`** | Queries Wikipedia for general information. | External API (Wikipedia) |
| **\`getCryptoTechnicalAnalysis\`** | Fetches Price, Volume, and calculates SMAs for crypto. | External API (CryptoCompare) |
| **\`scheduleMeeting\`** | Schedules events. | Mock Backend (simulated success) |
| **\`checkInventory\`** | Checks SKU availability. | Mock Data |
| **\`queryDocument\`** | RAG implementation: searches uploaded documents using cosine similarity. | Local Logic |
| **\`updateSemanticMemory\`** | Saves user preferences to long-term memory. | Internal State Update |
| **\`generateCreativeConcept\`** | Generates story ideas using \`gemini-2.5-pro\`. | AI-on-AI Call |

## Security & Privacy
- **Biometrics**: No images are stored permanently. Only a text description is saved locally.
- **API Keys**: Keys are used client-side. In a production environment, tool execution should be proxied through a secure backend.`;
