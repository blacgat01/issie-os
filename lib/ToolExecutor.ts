
import { DocumentData } from "../types";
import { GoogleGenAI } from "@google/genai";
import * as apiClient from './apiClient'; // Import the new API client

interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

// --- Helper Functions ---

// Helper to calculate Simple Moving Average
const calculateSMA = (data: number[], period: number): number | null => {
    if (!data || data.length < period) return null;
    const periodData = data.slice(-period);
    const sum = periodData.reduce((acc, val) => acc + val, 0);
    return sum / period;
};

// Helper to parse the Wikipedia API response
const parseWikipediaResponse = (data: any): string => {
    if (data.query && data.query.search && data.query.search.length > 0) {
        const firstResult = data.query.search[0];
        const snippet = firstResult.snippet.replace(/<[^>]*>/g, '');
        return `According to Wikipedia's article on "${firstResult.title}", ${snippet}...`;
    }
    return "I couldn't find a relevant summary for that query on Wikipedia.";
};

// --- Tool Execution Logic ---

// 1. Bitcoin Price Lookup (Specific)
const executeBitcoinPriceLookup = async (): Promise<{ result: string } | null> => {
    try {
        const url = `https://blockchain.info/ticker`;
        const response = await fetch(url);
        if (!response.ok) return null; 
        const data = await response.json();
        const price = data.USD?.last;
        if (price) {
            const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
            return { result: `The current price of Bitcoin is ${formattedPrice}.` };
        }
        return null;
    } catch (error) {
        console.error("Bitcoin price lookup failed:", error);
        return null;
    }
};

// 2. Crypto Technical Analysis (Generalized)
const executeCryptoTechnicalAnalysis = async (cryptocurrency: string): Promise<{ result: string }> => {
    const cryptoSymbol = cryptocurrency.toUpperCase();
    const cryptoName = cryptocurrency.charAt(0).toUpperCase() + cryptocurrency.slice(1);
    console.log(`Attempting to perform technical analysis for ${cryptoName} (${cryptoSymbol}).`);

    try {
        const historyUrl = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${cryptoSymbol}&tsym=USD&limit=30`;
        const historyResponse = await fetch(historyUrl);
        if (!historyResponse.ok) throw new Error(`Failed to fetch historical data for ${cryptoName}`);
        const historyData = await historyResponse.json();
        if (historyData.Response === 'Error') throw new Error(historyData.Message);
        const closingPrices = historyData.Data.Data.map((d: { close: number }) => d.close);
        
        const sma7 = calculateSMA(closingPrices, 7);
        const sma30 = calculateSMA(closingPrices, 30);

        const currentUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${cryptoSymbol}&tsyms=USD`;
        const currentResponse = await fetch(currentUrl);
        if (!currentResponse.ok) throw new Error(`Failed to fetch current market data for ${cryptoName}`);
        const currentData = await currentResponse.json();

        const cryptoData = currentData.RAW?.[cryptoSymbol]?.USD;
        if (!cryptoData) throw new Error(`No market data found for ${cryptoName}. Please check if it's a valid cryptocurrency symbol.`);
        
        const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        
        let resultString = `Here is a summary of technical indicators for ${cryptoName}:\n`;
        resultString += `- Current Price: ${formatCurrency(cryptoData.PRICE)}\n`;
        resultString += `- 24-Hour Change: ${cryptoData.CHANGEPCT24HOUR.toFixed(2)}%\n`;
        resultString += `- 24-Hour Volume: ${formatCurrency(cryptoData.VOLUME24HOUR)}\n`;
        if (sma7) resultString += `- 7-Day SMA: ${formatCurrency(sma7)}\n`;
        if (sma30) resultString += `- 30-Day SMA: ${formatCurrency(sma30)}`;

        let interpretation = '';
        const currentPrice = cryptoData.PRICE;
        if (sma7 && sma30) {
            interpretation += '\n\n**Data Interpretation:**\n';
            if (currentPrice > sma7) {
                interpretation += '- The current price is trading above its 7-day average, which can be interpreted as a short-term bullish signal.\n';
            } else {
                interpretation += '- The current price is trading below its 7-day average, which can be interpreted as a short-term bearish signal.\n';
            }
            if (currentPrice > sma30) {
                interpretation += '- The price is also trading above its 30-day average, suggesting a positive medium-term trend.';
            } else {
                interpretation += '- The price is also trading below its 30-day average, suggesting a negative medium-term trend.';
            }
        }
        resultString += interpretation;

        return { result: resultString };
    } catch (error: any) {
        console.error(`${cryptoName} technical analysis failed:`, error);
        return { result: `I was unable to retrieve the data needed to perform a technical analysis for ${cryptoName}. Reason: ${error.message}` };
    }
};

// 3. Web Search (General)
const executeSearchWeb = async (query: string): Promise<{ result: string }> => {
    if (!navigator.onLine) {
        return { result: "I can't perform a web search right now as I appear to be offline." };
    }
    console.log(`EXECUTING WEB SEARCH FOR: "${query}"`);

    const cryptoQueryRegex = /(?:price of|current price of|what's the price of|price for)\s+(bitcoin|btc)/i;
    if (cryptoQueryRegex.test(query)) {
        const priceResult = await executeBitcoinPriceLookup();
        if (priceResult) return priceResult;
    }

    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Wikipedia API request failed with status ${response.status}`);
        const data = await response.json();
        return { result: parseWikipediaResponse(data) };
    } catch (error: any) {
        console.error("Web search failed:", error);
        return { result: `Error performing web search: ${error.message}` };
    }
};

// 4. Inventory Check (Mock)
const executeCheckInventory = async (sku: string): Promise<{ status: string, stock: number }> => {
    console.log(`EXECUTING INVENTORY LOOKUP FOR SKU: "${sku}"`);
    return sku === 'GEM-001' ? { status: 'In Stock', stock: 152 } : { status: 'Out of Stock', stock: 0 };
};

// 5. Generate Alert (Mock)
const executeGenerateAlert = async (summary: string, level: string): Promise<{ result: string }> => {
    console.log(`[ACTION] ALERT GENERATED: Level ${level} - ${summary}`);
    return { result: `Successfully created a ${level} priority alert: "${summary}"` };
};

// 6. Document Query (RAG with Semantic Search)
const processText = (text: string): Map<string, number> => {
    const wordCounts = new Map<string, number>();
    const tokens = text.toLowerCase().match(/\b\w+\b/g) || [];
    tokens.forEach(token => wordCounts.set(token, (wordCounts.get(token) || 0) + 1));
    return wordCounts;
};

const calculateCosineSimilarity = (vecA: Map<string, number>, vecB: Map<string, number>): number => {
    let dotProduct = 0, magA = 0, magB = 0;
    const allKeys = new Set([...vecA.keys(), ...vecB.keys()]);
    allKeys.forEach(key => dotProduct += (vecA.get(key) || 0) * (vecB.get(key) || 0));
    vecA.forEach(val => magA += val * val);
    vecB.forEach(val => magB += val * val);
    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);
    return (magA === 0 || magB === 0) ? 0 : dotProduct / (magA * magB);
};

const executeQueryDocument = async (query: string, document: DocumentData | null): Promise<{ result: string }> => {
    console.log(`EXECUTING DOCUMENT QUERY: "${query}"`);
    if (!document) {
        return { result: "No document is loaded. Please upload a document first." };
    }
    
    const queryVector = processText(query);
    const scoredRows = document.rows.map((row) => {
        const rowVector = processText(row.join(' '));
        return { row, similarity: calculateCosineSimilarity(queryVector, rowVector) };
    }).filter(item => item.similarity > 0.1);

    scoredRows.sort((a, b) => b.similarity - a.similarity);

    if (scoredRows.length === 0) {
        return { result: "I could not find any information matching that query in the document." };
    }
    
    const topResults = scoredRows.slice(0, 3).map(item => 
        document.headers.map((header, i) => `${header}: ${item.row[i]}`).join(', ')
    ).join('\n---\n');

    return { result: `Based on your query, here are the most relevant results from the document:\n${topResults}` };
};

// 7. Generate Creative Concept (Agentic)
const executeGenerateCreativeConcept = async (coreIdea: string): Promise<{ result: string }> => {
    console.log(`EXECUTING CREATIVE CONCEPT GENERATION FOR: "${coreIdea}"`);
    const prompt = `
    You are a world-class creative strategist and story developer. Your user, Gabe, is a builder of cinematic, gritty, and grounded narratives.
    His creative signature involves high-stakes finance, urban drama, AI power structures, and hidden economies.

    He has provided a core idea. Your task is to expand this into a structured creative concept. The tone should be professional, sharp, and aligned with his style.

    Core Idea: "${coreIdea}"

    Generate the following, formatted as clear markdown:
    - **Logline:** A compelling one-sentence summary.
    - **Synopsis:** A short paragraph (3-5 sentences) outlining the plot.
    - **Key Themes:** 3-4 core themes the story explores (e.g., "Ambition vs. Morality", "Humanity in a Tech-Driven World").
    - **Target Audience:** A brief description of the ideal viewer.
    `;
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Use a powerful model for creative tasks
            contents: prompt,
        });
        
        const text = response.text;
        return { result: text };
    } catch (error: any) {
        console.error("Creative concept generation failed:", error);
        return { result: `I encountered an error while trying to develop that concept: ${error.message}` };
    }
};

// 8. Generate Chart (Visualization)
const executeGenerateChart = async (title: string, type: string, data: any[]): Promise<{ result: string }> => {
    return { result: `Chart "${title}" generated successfully for the user.` };
};

// 9. File System: List Directory
const executeListDirectory = async (subPath: string | undefined, directoryHandle: any): Promise<{ result: string }> => {
    if (!directoryHandle) {
        return { result: "No project directory is currently open. Ask the user to load a project first." };
    }
    
    try {
        let targetHandle = directoryHandle;
        
        // Simple path traversal logic (shallow for now, or assumes subPath is a direct child name for simplicity)
        // For a real deep traversal, we'd need a recursive finder.
        // We will just list the root or the immediate child if specified.
        if (subPath) {
             try {
                 targetHandle = await directoryHandle.getDirectoryHandle(subPath);
             } catch (e) {
                 return { result: `Directory '${subPath}' not found in the root.` };
             }
        }

        const entries = [];
        for await (const entry of targetHandle.values()) {
            entries.push(entry.kind === 'directory' ? `[DIR] ${entry.name}` : `[FILE] ${entry.name}`);
        }
        return { result: `Contents of ${subPath || 'root'}:\n${entries.join('\n')}` };
    } catch (error: any) {
        return { result: `Failed to list directory: ${error.message}` };
    }
};

// 10. File System: Read File
const executeReadProjectFile = async (filePath: string, directoryHandle: any): Promise<{ result: string }> => {
    if (!directoryHandle) {
        return { result: "No project directory is currently open." };
    }
    
    try {
        // Split path by '/' to traverse
        const parts = filePath.split('/');
        const fileName = parts.pop()!;
        let currentHandle = directoryHandle;

        for (const part of parts) {
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }
        
        const fileHandle = await currentHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        // Truncate massive files to prevent token overflow
        const truncated = content.length > 20000 ? content.substring(0, 20000) + "\n...[File truncated]" : content;
        
        return { result: `Content of ${filePath}:\n\`\`\`\n${truncated}\n\`\`\`` };
    } catch (error: any) {
        return { result: `Failed to read file '${filePath}': ${error.message}` };
    }
};


// --- Main Tool Router ---
export const executeToolCall = async (
  functionCall: FunctionCall,
  documentContent: DocumentData | null,
  directoryHandle: any | null // FileSystemDirectoryHandle
): Promise<any> => {
  const { name, args } = functionCall;

  switch (name) {
    case 'searchWeb':
      return await executeSearchWeb(args.query);
    case 'getCryptoTechnicalAnalysis':
      return await executeCryptoTechnicalAnalysis(args.cryptocurrency);
    case 'generateCreativeConcept':
      return await executeGenerateCreativeConcept(args.coreIdea);
    case 'scheduleMeeting':
        return await apiClient.scheduleMeetingOnBackend(args.title, args.time);
    case 'checkInventory':
      return await executeCheckInventory(args.sku);
    case 'generateAlert':
      return await executeGenerateAlert(args.alertSummary, args.alertLevel);
    case 'queryDocument':
      return await executeQueryDocument(args.query, documentContent);
    case 'generateChart':
      return await executeGenerateChart(args.title, args.type, args.data);
    case 'listDirectory':
      return await executeListDirectory(args.subPath, directoryHandle);
    case 'readProjectFile':
      return await executeReadProjectFile(args.filePath, directoryHandle);
    default:
      return { result: `Tool '${name}' executed.` };
  }
};
