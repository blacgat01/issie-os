
import { FunctionDeclaration, Type } from '@google/genai';

// --- Consolidated Tool Definitions ---

// This tool was moved from lib/tools.ts to resolve a module loading error.
export const displayEmotionAndRespond: FunctionDeclaration = {
  name: 'displayEmotionAndRespond',
  parameters: {
    type: Type.OBJECT,
    description: 'Displays the detected emotion and provides an empathetic verbal response. Use this ONLY when there is a significant change in emotion that warrants a specific reaction, not for continuous state monitoring.',
    properties: {
      emotion: {
        type: Type.STRING,
        description: 'A single, descriptive word for the user\'s primary emotional state (e.g., "curious", "frustrated", "pleased", "calm").',
      },
      response: {
        type: Type.STRING,
        description: 'A brief, empathetic spoken response that reflects the user\'s state. Should be a single sentence.',
      },
    },
    required: ['emotion', 'response'],
  },
};

// Web Search Tool
export const webSearchDeclaration: FunctionDeclaration = {
  name: 'searchWeb',
  description: 'Searches the internet for up-to-date information on a given query.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search term or question to look up.' },
    },
    required: ['query'],
  },
};

// New Flexible Financial Tool for Technical Analysis
export const cryptoTechnicalAnalysisDeclaration: FunctionDeclaration = {
  name: 'getCryptoTechnicalAnalysis',
  description: 'Performs a technical analysis on a major cryptocurrency (e.g., Bitcoin, Ethereum) by fetching current price, volume, 24-hour change, and calculating 7-day and 30-day simple moving averages.',
  parameters: {
    type: Type.OBJECT,
    properties: {
       cryptocurrency: { 
         type: Type.STRING, 
         description: 'The name of the cryptocurrency in lowercase, e.g., "bitcoin", "ethereum".' 
        },
    },
    required: ['cryptocurrency'],
  },
};


// Logistics Tool Pack
export const inventoryLookupDeclaration: FunctionDeclaration = {
  name: 'checkInventory',
  description: 'Checks the current stock level for a product SKU in the main warehouse database.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sku: { type: Type.STRING, description: 'The Stock Keeping Unit (SKU) identifier.' },
    },
    required: ['sku'],
  },
};

// New Financial Tool
export const generateAlertDeclaration: FunctionDeclaration = {
  name: 'generateAlert',
  description: 'Creates a local, immediate notification or alert for the user based on critical information.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      alertSummary: {
        type: Type.STRING,
        description: 'A brief, action-oriented summary of the critical event.',
      },
      alertLevel: {
        type: Type.STRING,
        description: 'The severity level of the alert: High, Medium, or Low.',
      },
    },
    required: ['alertSummary', 'alertLevel'],
  },
};

// New Document Analysis Tool (RAG)
export const queryDocumentDeclaration: FunctionDeclaration = {
    name: 'queryDocument',
    description: 'Performs a semantic search or query against the user-uploaded document.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: 'The natural language question or search term to find within the document.',
            },
        },
        required: ['query'],
    },
};

// New Active Learning Tool
export const updateSemanticMemoryDeclaration: FunctionDeclaration = {
    name: 'updateSemanticMemory',
    description: "Updates the user's long-term profile with a new preference or piece of information learned during the conversation.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            newPreference: {
                type: Type.STRING,
                description: "A concise statement about a user's preference or a new fact learned about them (e.g., 'Prefers summaries in bullet points', 'Is learning to play the guitar').",
            },
        },
        required: ['newPreference'],
    },
};

// New Creative Development Tool
export const generateCreativeConceptDeclaration: FunctionDeclaration = {
  name: 'generateCreativeConcept',
  description: 'Takes a core idea and generates a structured creative concept for a story, film, or series. It produces a logline, synopsis, themes, and target audience.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      coreIdea: { type: Type.STRING, description: 'A brief, one-sentence description of the initial creative idea.' },
    },
    required: ['coreIdea'],
  },
};

// New Action-Oriented Tool for Real-World Integration
export const scheduleMeetingDeclaration: FunctionDeclaration = {
  name: 'scheduleMeeting',
  description: 'Schedules a meeting or event in the user\'s calendar.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The title of the event or meeting.' },
      time: { type: Type.STRING, description: 'The date and time of the meeting in a natural language format (e.g., "Friday at 2 PM", "Tomorrow morning").' },
    },
    required: ['title', 'time'],
  },
};

// Security Tool
export const confirmBiometricIdentityDeclaration: FunctionDeclaration = {
  name: 'confirmBiometricIdentity',
  description: 'Call this tool when you have visually confirmed that the person in the camera matches the authorized user description. This unlocks full system access.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      match: { type: Type.BOOLEAN, description: 'True if the face matches the authorized user, False otherwise.' },
    },
    required: ['match'],
  },
};

// Visualization Tool
export const generateChartDeclaration: FunctionDeclaration = {
    name: 'generateChart',
    description: 'Generates a visual chart to display data trends, comparisons, or statistics. Use this when the user asks to "visualize", "plot", or "show" data.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'A short title for the chart.' },
            type: { type: Type.STRING, enum: ['bar', 'line'], description: 'The type of chart to render.' },
            data: {
                type: Type.ARRAY,
                description: 'The data points to plot.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING, description: 'Label for the X-axis (e.g., "Jan", "Q1").' },
                        value: { type: Type.NUMBER, description: 'Numerical value for the Y-axis.' }
                    },
                    required: ['label', 'value']
                }
            }
        },
        required: ['title', 'type', 'data']
    }
};

// File System Tool: List Directory
export const listDirectoryDeclaration: FunctionDeclaration = {
  name: 'listDirectory',
  description: 'Lists the files and folders in the currently open project directory. Use this to explore the user\'s codebase or project structure.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      subPath: { 
        type: Type.STRING, 
        description: 'Optional sub-directory path to list. If omitted, lists the root of the project.' 
      },
    },
  },
};

// File System Tool: Read File
export const readProjectFileDeclaration: FunctionDeclaration = {
  name: 'readProjectFile',
  description: 'Reads the content of a specific file within the open project directory. Use this to analyze code or read text files.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      filePath: { 
        type: Type.STRING, 
        description: 'The relative path to the file to read (e.g., "src/App.tsx" or "README.md").' 
      },
    },
    required: ['filePath'],
  },
};

// Ambient Audio Tool (Focus Mode)
export const playAmbientAudioDeclaration: FunctionDeclaration = {
  name: 'playAmbientAudio',
  description: 'Plays or stops ambient background sounds to help the user focus or relax. Use this when the user asks for "focus mode", "white noise", or to "block out distraction".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { 
        type: Type.STRING, 
        enum: ['start', 'stop'],
        description: 'Whether to start or stop the audio.'
      },
    },
    required: ['action'],
  },
};


// Export all for easy access
export const ToolDeclarations = {
    displayEmotionAndRespond,
    webSearch: webSearchDeclaration,
    getCryptoTechnicalAnalysis: cryptoTechnicalAnalysisDeclaration,
    generateCreativeConcept: generateCreativeConceptDeclaration,
    scheduleMeeting: scheduleMeetingDeclaration,
    checkInventory: inventoryLookupDeclaration,
    generateAlert: generateAlertDeclaration,
    queryDocument: queryDocumentDeclaration,
    updateSemanticMemory: updateSemanticMemoryDeclaration,
    confirmBiometricIdentity: confirmBiometricIdentityDeclaration,
    generateChart: generateChartDeclaration,
    listDirectory: listDirectoryDeclaration,
    readProjectFile: readProjectFileDeclaration,
    playAmbientAudio: playAmbientAudioDeclaration,
};
