
import { FunctionDeclaration, Type } from '@google/genai';

// ... (Keep existing exports) ...
// Agent: DIRECTOR
export const displayEmotionAndRespond: FunctionDeclaration = {
  name: 'displayEmotionAndRespond',
  parameters: {
    type: Type.OBJECT,
    description: 'Displays the detected emotion and provides an empathetic verbal response.',
    properties: {
      emotion: { type: Type.STRING },
      response: { type: Type.STRING },
    },
    required: ['emotion', 'response'],
  },
};

// Agent: MISSION CONTROL
export const manageMissionDeclaration: FunctionDeclaration = {
    name: 'manageMission',
    description: 'Manages the "Mission Log" (Active Tasks).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ['add', 'complete', 'delete', 'list'] },
            taskDescription: { type: Type.STRING },
            taskId: { type: Type.STRING },
        },
        required: ['action'],
    },
};

// Agent: NAVIGATOR
export const webSearchDeclaration: FunctionDeclaration = {
  name: 'searchWeb',
  description: 'Searches the internet for information.',
  parameters: {
    type: Type.OBJECT,
    properties: { query: { type: Type.STRING } },
    required: ['query'],
  },
};

// Agent: TRADER
export const cryptoTechnicalAnalysisDeclaration: FunctionDeclaration = {
  name: 'getCryptoTechnicalAnalysis',
  description: 'Performs a technical analysis on a major cryptocurrency using aggregated market data.',
  parameters: {
    type: Type.OBJECT,
    properties: { cryptocurrency: { type: Type.STRING } },
    required: ['cryptocurrency'],
  },
};

// Agent: NAVIGATOR (Logistics)
export const inventoryLookupDeclaration: FunctionDeclaration = {
  name: 'checkInventory',
  description: 'Checks the current stock level.',
  parameters: {
    type: Type.OBJECT,
    properties: { sku: { type: Type.STRING } },
    required: ['sku'],
  },
};

// Agent: NAVIGATOR
export const generateAlertDeclaration: FunctionDeclaration = {
  name: 'generateAlert',
  description: 'Creates a notification alert.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      alertSummary: { type: Type.STRING },
      alertLevel: { type: Type.STRING },
    },
    required: ['alertSummary', 'alertLevel'],
  },
};

// Agent: ENGINEER (Analyst)
export const queryDocumentDeclaration: FunctionDeclaration = {
    name: 'queryDocument',
    description: 'Performs a semantic search on the uploaded document.',
    parameters: {
        type: Type.OBJECT,
        properties: { query: { type: Type.STRING } },
        required: ['query'],
    },
};

// Agent: MEMORY
export const updateSemanticMemoryDeclaration: FunctionDeclaration = {
    name: 'updateSemanticMemory',
    description: "Updates user profile with new facts.",
    parameters: {
        type: Type.OBJECT,
        properties: { newPreference: { type: Type.STRING } },
        required: ['newPreference'],
    },
};

// Agent: DIRECTOR
export const generateCreativeConceptDeclaration: FunctionDeclaration = {
  name: 'generateCreativeConcept',
  description: 'Generates a creative story concept.',
  parameters: {
    type: Type.OBJECT,
    properties: { coreIdea: { type: Type.STRING } },
    required: ['coreIdea'],
  },
};

// Agent: NAVIGATOR
export const scheduleMeetingDeclaration: FunctionDeclaration = {
  name: 'scheduleMeeting',
  description: 'Schedules a meeting.',
  parameters: {
    type: Type.OBJECT,
    properties: { title: { type: Type.STRING }, time: { type: Type.STRING } },
    required: ['title', 'time'],
  },
};

// Agent: SENTINEL
export const confirmBiometricIdentityDeclaration: FunctionDeclaration = {
  name: 'confirmBiometricIdentity',
  description: 'Unlocks system access upon biometric verification (Face or Voice).',
  parameters: {
    type: Type.OBJECT,
    properties: { 
        match: { type: Type.BOOLEAN },
        modality: { type: Type.STRING, enum: ['face', 'voice'] }
    },
    required: ['match'],
  },
};

// Agent: TRADER
export const generateChartDeclaration: FunctionDeclaration = {
    name: 'generateChart',
    description: 'Generates a visual chart.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['bar', 'line'] },
            data: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } }
        },
        required: ['title', 'type', 'data']
    }
};

// Agent: ENGINEER
export const listDirectoryDeclaration: FunctionDeclaration = {
  name: 'listDirectory',
  description: 'Lists files in mounted project.',
  parameters: {
    type: Type.OBJECT,
    properties: { subPath: { type: Type.STRING } },
  },
};

// Agent: ENGINEER
export const readProjectFileDeclaration: FunctionDeclaration = {
  name: 'readProjectFile',
  description: 'Reads file content.',
  parameters: {
    type: Type.OBJECT,
    properties: { filePath: { type: Type.STRING } },
    required: ['filePath'],
  },
};

// Agent: DIRECTOR
export const playAmbientAudioDeclaration: FunctionDeclaration = {
  name: 'playAmbientAudio',
  description: 'Controls focus mode audio.',
  parameters: {
    type: Type.OBJECT,
    properties: { action: { type: Type.STRING, enum: ['start', 'stop'] } },
    required: ['action'],
  },
};

// Agent: NAVIGATOR
export const getWeatherForecastDeclaration: FunctionDeclaration = {
    name: 'getWeatherForecast',
    description: 'Gets local weather.',
    parameters: {
        type: Type.OBJECT,
        properties: { latitude: { type: Type.NUMBER }, longitude: { type: Type.NUMBER } },
        required: ['latitude', 'longitude'],
    },
};

// Agent: ENGINEER (Scribe)
export const captureScreenDeclaration: FunctionDeclaration = {
    name: 'captureScreen',
    description: 'Saves current frame as image.',
    parameters: {
        type: Type.OBJECT,
        properties: { filename: { type: Type.STRING } },
        required: ['filename'],
    },
};

// Agent: ENGINEER (Visual Ingestion)
export const readVisualCodeDeclaration: FunctionDeclaration = {
    name: 'readVisualCode',
    description: 'Scans the current camera view for QR codes or Barcodes using local device hardware. Returns the decoded text.',
    parameters: { type: Type.OBJECT, properties: {} },
};

// Agent: ENGINEER (Scribe)
export const copyToClipboardDeclaration: FunctionDeclaration = {
    name: 'copyToClipboard',
    description: 'Copies text to clipboard.',
    parameters: {
        type: Type.OBJECT,
        properties: { content: { type: Type.STRING } },
        required: ['content'],
    },
};

// Agent: NAVIGATOR
export const openUrlDeclaration: FunctionDeclaration = {
    name: 'openUrl',
    description: 'Opens a URL in a new tab.',
    parameters: {
        type: Type.OBJECT,
        properties: { url: { type: Type.STRING } },
        required: ['url'],
    },
};

// Agent: ENGINEER
export const saveToDiskDeclaration: FunctionDeclaration = {
    name: 'saveToDisk',
    description: 'Saves content to a local file. If a project is mounted, it writes directly to disk (OVERWRITES EXISTING). Otherwise, it triggers a download.',
    parameters: {
        type: Type.OBJECT,
        properties: { filename: { type: Type.STRING }, content: { type: Type.STRING } },
        required: ['filename', 'content'],
    },
};

// Agent: ENGINEER (Self-Evolution)
export const patchFileDeclaration: FunctionDeclaration = {
    name: 'patchFile',
    description: 'Surgically replaces a specific string in a file with a new string. Use this to modify source code or config files.',
    parameters: {
        type: Type.OBJECT,
        properties: { 
            filePath: { type: Type.STRING }, 
            searchString: { type: Type.STRING },
            replaceString: { type: Type.STRING }
        },
        required: ['filePath', 'searchString', 'replaceString'],
    },
};

// Agent: ENGINEER (DevOps)
export const pushToGitHubDeclaration: FunctionDeclaration = {
    name: 'pushToGitHub',
    description: 'Commits and pushes a file update directly to the GitHub repository. Use this for Mobile Autonomy to trigger CI/CD builds.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            filePath: { type: Type.STRING },
            content: { type: Type.STRING },
            commitMessage: { type: Type.STRING }
        },
        required: ['filePath', 'content', 'commitMessage'],
    },
};

// Agent: NAVIGATOR
export const getBatteryStatusDeclaration: FunctionDeclaration = {
    name: 'getBatteryStatus',
    description: 'Checks battery level.',
    parameters: { type: Type.OBJECT, properties: {} },
};

// Agent: SENTINEL
export const getSystemStatusDeclaration: FunctionDeclaration = {
    name: 'getSystemStatus',
    description: 'Runs system diagnostics.',
    parameters: { type: Type.OBJECT, properties: {} },
};

// Agent: SYSTEM
export const createSystemSnapshotDeclaration: FunctionDeclaration = {
    name: 'createSystemSnapshot',
    description: 'Creates an encrypted full-system snapshot (Memory, History, Tasks) and triggers a download for the user.',
    parameters: { type: Type.OBJECT, properties: {} },
};

// Agent: SYSTEM
export const restoreSystemSnapshotDeclaration: FunctionDeclaration = {
    name: 'restoreSystemSnapshot',
    description: 'Instructions on how to restore the system from a backup file.',
    parameters: { type: Type.OBJECT, properties: {} },
};

// Agent: COACH
export const provideCoachingTipDeclaration: FunctionDeclaration = {
    name: 'provideCoachingTip',
    description: 'Provides a short, real-time coaching tip or observation. Use this only in Coaching Mode to guide the user without interrupting the audio flow.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            tip: { type: Type.STRING, description: "Short tip (max 10 words)." },
            severity: { type: Type.STRING, enum: ['neutral', 'warning', 'critical'], description: "Urgency level." }
        },
        required: ['tip', 'severity'],
    },
};

// Agent: NAVIGATOR (Native Speech)
export const announceLocallyDeclaration: FunctionDeclaration = {
    name: 'announceLocally',
    description: 'Uses the device native TTS engine to speak a message locally (Offline). Use for critical alerts or when network is poor.',
    parameters: {
        type: Type.OBJECT,
        properties: { message: { type: Type.STRING } },
        required: ['message'],
    },
};

// --- NEW TRADER TOOLS ---

export const getQuantMetricsDeclaration: FunctionDeclaration = {
    name: 'getQuantMetrics',
    description: 'Fetches RSI, MACD, and Bollinger Bands for a crypto asset across multiple timeframes to determine trade probability.',
    parameters: {
        type: Type.OBJECT,
        properties: { 
            cryptocurrency: { type: Type.STRING },
            timeframes: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['1h', '4h', '1d'] }, description: "Optional list of timeframes to analyze" }
        },
        required: ['cryptocurrency']
    }
};

export const executePaperTradeDeclaration: FunctionDeclaration = {
    name: 'executePaperTrade',
    description: 'Executes a simulated trade in the Paper Wallet. Use this when the strategy probability is high.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            symbol: { type: Type.STRING },
            side: { type: Type.STRING, enum: ['BUY', 'SELL'] },
            amountUSD: { type: Type.NUMBER, description: "Amount in USD to trade" },
            stopLoss: { type: Type.NUMBER, description: "Stop Loss Price (Optional but recommended)" },
            takeProfit: { type: Type.NUMBER, description: "Take Profit Price (Optional but recommended)" }
        },
        required: ['symbol', 'side', 'amountUSD']
    }
};

// Agent: TRADER (Arbitrage)
export const checkArbitrageDeclaration: FunctionDeclaration = {
    name: 'checkArbitrage',
    description: 'Checks for price discrepancies of a specific asset across multiple exchanges (Binance, Coinbase, Kraken, Bitfinex).',
    parameters: {
        type: Type.OBJECT,
        properties: { symbol: { type: Type.STRING } },
        required: ['symbol']
    }
};

// Agent: TRADER (Sentiment)
export const getMarketSentimentDeclaration: FunctionDeclaration = {
    name: 'getMarketSentiment',
    description: 'Fetches the current Fear & Greed Index to gauge global market sentiment.',
    parameters: { type: Type.OBJECT, properties: {} }
};

// Agent: TRADER (Risk)
export const calculateRiskDeclaration: FunctionDeclaration = {
    name: 'calculateRisk',
    description: 'Calculates optimal position size and Risk/Reward ratio based on Kelly Criterion and account balance.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            entryPrice: { type: Type.NUMBER },
            stopLossPrice: { type: Type.NUMBER },
            takeProfitPrice: { type: Type.NUMBER },
            riskPercentage: { type: Type.NUMBER, description: "Percentage of wallet to risk (default 1-2%)" }
        },
        required: ['entryPrice', 'stopLossPrice', 'takeProfitPrice']
    }
};

// Agent: TRADER (Backtest)
export const runBacktestDeclaration: FunctionDeclaration = {
    name: 'runBacktest',
    description: 'Simulates a trading strategy (RSI Mean Reversion) on historical data to calculate potential PnL and Win Rate.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            symbol: { type: Type.STRING },
            timeframe: { type: Type.STRING, enum: ['1h', '4h', '1d'] }
        },
        required: ['symbol']
    }
};

// Agent: TRADER (Blockchain Watcher)
export const checkPublicWalletDeclaration: FunctionDeclaration = {
    name: 'checkPublicWallet',
    description: 'Checks the balance of a public blockchain address (BTC, ETH, or SOL) using a block explorer.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            chain: { type: Type.STRING, enum: ['BTC', 'ETH', 'SOL'] },
            address: { type: Type.STRING }
        },
        required: ['chain', 'address']
    }
};

// Agent: TRADER (DeFi - Gas)
export const getGasPriceDeclaration: FunctionDeclaration = {
    name: 'getGasPrice',
    description: 'Checks current gas fees on Ethereum or Solana to optimize trade timing.',
    parameters: {
        type: Type.OBJECT,
        properties: { chain: { type: Type.STRING, enum: ['ETH', 'SOL'] } },
        required: ['chain']
    }
};

// Agent: TRADER (DeFi - DEX Quote)
export const getDexQuoteDeclaration: FunctionDeclaration = {
    name: 'getDexQuote',
    description: 'Gets a real-time swap quote from a Decentralized Exchange (Jupiter for Solana). Use this to find the TRUE on-chain price.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            inputToken: { type: Type.STRING, description: "Symbol (e.g., SOL, USDC)" },
            outputToken: { type: Type.STRING, description: "Symbol (e.g., BONK, WIF)" },
            amount: { type: Type.NUMBER, description: "Amount of input token to swap" }
        },
        required: ['inputToken', 'outputToken', 'amount']
    }
};

// Agent: TRADER (DeFi - Security)
export const analyzeTokenSecurityDeclaration: FunctionDeclaration = {
    name: 'analyzeTokenSecurity',
    description: 'Analyzes a token contract for security risks (Honeypot, Locked Liquidity).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            tokenAddress: { type: Type.STRING },
            chain: { type: Type.STRING, enum: ['ETH', 'SOL'] }
        },
        required: ['tokenAddress', 'chain']
    }
};

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
    patchFile: patchFileDeclaration,
    pushToGitHub: pushToGitHubDeclaration,
    playAmbientAudio: playAmbientAudioDeclaration,
    getWeatherForecast: getWeatherForecastDeclaration,
    captureScreen: captureScreenDeclaration,
    readVisualCode: readVisualCodeDeclaration,
    copyToClipboard: copyToClipboardDeclaration,
    openUrl: openUrlDeclaration,
    saveToDisk: saveToDiskDeclaration,
    getBatteryStatus: getBatteryStatusDeclaration,
    getSystemStatus: getSystemStatusDeclaration,
    manageMission: manageMissionDeclaration,
    createSystemSnapshot: createSystemSnapshotDeclaration,
    restoreSystemSnapshot: restoreSystemSnapshotDeclaration,
    provideCoachingTip: provideCoachingTipDeclaration, 
    announceLocally: announceLocallyDeclaration,
    getQuantMetrics: getQuantMetricsDeclaration,
    executePaperTrade: executePaperTradeDeclaration,
    checkArbitrage: checkArbitrageDeclaration,
    getMarketSentiment: getMarketSentimentDeclaration,
    calculateRisk: calculateRiskDeclaration,
    runBacktest: runBacktestDeclaration,
    checkPublicWallet: checkPublicWalletDeclaration,
    getGasPrice: getGasPriceDeclaration,
    getDexQuote: getDexQuoteDeclaration,
    analyzeTokenSecurity: analyzeTokenSecurityDeclaration,
};
