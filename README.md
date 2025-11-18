# Issie: Unified Cognitive Agent

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

1. **Environment**: Ensure `REACT_APP_GEMINI_API_KEY` is set in your environment.
2. **Permissions**: Allow access to Microphone, Camera, and Location when prompted.
3. **Interaction**:
   - Click the **Mic** button to start a session.
   - Enable **Vision** to let Issie see.
   - Use the **Settings** panel to register your face for security.

## Tech Stack
- **Frontend**: React 18, Tailwind CSS
- **AI SDK**: `@google/genai`
- **State Management**: React Context + Reducer
- **Audio**: Web Audio API (PCM processing)
