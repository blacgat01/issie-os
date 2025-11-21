
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptTurn, SemanticMemory } from "../types";
import { isNanoAvailable, generateLocalContent } from "../nano";

const memoryExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A brief, one-sentence summary of the entire conversation's main goal or topic."
        },
        keyEntities: {
            type: Type.ARRAY,
            description: "A list of important proper nouns, concepts, or specific identifiers mentioned (e.g., names, product SKUs, locations).",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, description: "The category of the entity (e.g., Person, Product, Topic)." }
                },
                required: ["name", "type"]
            }
        },
        userPreferences: {
            type: Type.ARRAY,
            description: "A list of any explicit or strongly implied preferences the user has stated (e.g., 'Prefers concise answers', 'Interested in market data').",
            items: {
                type: Type.STRING
            }
        }
    },
    required: ["summary", "keyEntities", "userPreferences"]
};

export const extractSemanticMemory = async (transcript: TranscriptTurn[]): Promise<SemanticMemory | null> => {
    if (transcript.length === 0) {
        return null;
    }

    const formattedTranscript = transcript
        .map(turn => `User: ${turn.user || "(no speech)"}\nAssistant: ${turn.assistant || "(no speech)"}`)
        .join('\n\n');

    // 1. ATTEMPT LOCAL INFERENCE (GEMINI NANO)
    // This keeps the summarization process fully on-device for privacy.
    try {
        if (await isNanoAvailable()) {
            console.log("[Memory] Using Local Gemini Nano for Extraction...");
            const prompt = `
Analyze the following conversation transcript. Extract a JSON summary.
JSON Format required:
{
  "summary": "One sentence summary",
  "keyEntities": [{"name": "EntityName", "type": "EntityType"}],
  "userPreferences": ["Pref1", "Pref2"]
}

Transcript:
${formattedTranscript}
`;
            // Nano is text-in/text-out and doesn't support JSON schema enforcement natively yet in all versions.
            // We use a strong prompt to guide it.
            const rawResult = await generateLocalContent(prompt, "You are a JSON data extractor.");
            
            // Basic cleaning of Markdown code blocks if Nano adds them
            const cleanJson = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const memory: SemanticMemory = JSON.parse(cleanJson);
            return memory;
        }
    } catch (localError) {
        console.warn("[Memory] Local Nano inference failed, falling back to Cloud.", localError);
    }

    // 2. FALLBACK TO CLOUD (GEMINI FLASH)
    console.log("[Memory] Using Cloud Gemini Flash for Extraction...");
    const prompt = `Analyze the following conversation transcript. Your task is to extract a structured summary of the key information discussed. Focus on the main topic, important entities, and any user preferences that are revealed.

Here is the transcript:
---
${formattedTranscript}
---

Based on the transcript, provide the structured data.`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: memoryExtractionSchema,
                temperature: 0.1,
            },
        });

        const jsonText = response.text.trim();
        const memory: SemanticMemory = JSON.parse(jsonText);
        return memory;

    } catch (e) {
        console.error("Error extracting semantic memory:", e);
        return null;
    }
};
