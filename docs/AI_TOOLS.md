# AI & Tooling Documentation

## Gemini Configuration

**Models Used:**
- **`gemini-2.5-flash-native-audio-preview-09-2025`**: Used for the main live conversation loop. Optimized for low latency and audio modalities.
- **`gemini-2.5-flash`**: Used for one-shot tasks like Face Registration and Semantic Memory extraction.

**System Prompts (`lib/systemInstructions.ts`):**
The system prompt is dynamic and re-assembled for every session. It includes:
1. **Core Identity**: "Issie", the executive assistant and partner.
2. **Security Protocol**: Instructions on how to handle the "Locked" state and when to verify identity.
3. **Context**: Current location, resumed conversation transcript, and semantic memory summaries.
4. **Capabilities**: Explicit instructions on when to use specific tools.

## Available Tools

Defined in `lib/ToolDeclarations.ts` and executed in `lib/ToolExecutor.ts`.

| Tool Name | Description | Implementation |
|-----------|-------------|----------------|
| **`displayEmotionAndRespond`** | Updates the UI emotion meter and provides an empathetic response. | Internal State Update |
| **`confirmBiometricIdentity`** | Unlocks/Locks the application based on visual match. | Internal State Update |
| **`searchWeb`** | Queries Wikipedia for general information. | External API (Wikipedia) |
| **`getCryptoTechnicalAnalysis`** | Fetches Price, Volume, and calculates SMAs for crypto. | External API (CryptoCompare) |
| **`scheduleMeeting`** | Schedules events. | Mock Backend (simulated success) |
| **`checkInventory`** | Checks SKU availability. | Mock Data |
| **`queryDocument`** | RAG implementation: searches uploaded documents using cosine similarity. | Local Logic |
| **`updateSemanticMemory`** | Saves user preferences to long-term memory. | Internal State Update |
| **`generateCreativeConcept`** | Generates story ideas using `gemini-2.5-pro`. | AI-on-AI Call |

## Security & Privacy
- **Biometrics**: No images are stored permanently. Only a text description is saved locally.
- **API Keys**: Keys are used client-side. In a production environment, tool execution should be proxied through a secure backend.
