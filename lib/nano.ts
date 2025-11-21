
// Interface for the experimental window.ai API
declare global {
    interface Window {
        ai?: {
            languageModel: {
                capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
                create(options?: { systemPrompt?: string }): Promise<AILanguageModel>;
            };
        };
    }
}

interface AILanguageModel {
    prompt(input: string): Promise<string>;
    promptStreaming(input: string): ReadableStream;
    destroy(): void;
}

/**
 * Checks if Gemini Nano is available on this device.
 */
export const isNanoAvailable = async (): Promise<boolean> => {
    if (!window.ai || !window.ai.languageModel) return false;
    try {
        const capabilities = await window.ai.languageModel.capabilities();
        return capabilities.available === 'readily';
    } catch (e) {
        return false;
    }
};

/**
 * Generates text using the on-device Gemini Nano model.
 * This runs completely offline on the NPU (Tensor Chip).
 */
export const generateLocalContent = async (prompt: string, systemInstruction?: string): Promise<string> => {
    if (!await isNanoAvailable()) {
        throw new Error("Gemini Nano is not available on this device.");
    }

    let session: AILanguageModel | null = null;
    try {
        // Create a session with the local model
        session = await window.ai!.languageModel.create({
            systemPrompt: systemInstruction || "You are Issie's internal sub-process."
        });

        const result = await session.prompt(prompt);
        return result;
    } catch (e: any) {
        console.error("Local Inference Failed:", e);
        throw e;
    } finally {
        if (session) {
            session.destroy();
        }
    }
};
