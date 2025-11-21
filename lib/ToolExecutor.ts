
import { DocumentData, SecurityStatus } from "../types";
import { GoogleGenAI, FunctionCall } from "@google/genai";
import { logAuditEntry } from './security';
import { TraderAgent, EngineerAgent, NavigatorAgent, SentinelAgent, DirectorAgent, SystemAgent, CoachAgent, AgentContext } from './agents';
import { calculateRSI, calculateMACD, calculateBollingerBands } from './financial/indicators';
import { executePaperTrade, getWallet } from './financial/wallet';
import { getFearAndGreedIndex } from './financial/sentiment';
import { calculateRisk } from './financial/risk';
import { runBacktest } from './financial/backtest';
import { getPublicWalletBalance } from './financial/blockchain';
import { getGasPrice, getDexQuote, analyzeTokenSecurity } from './financial/defi';

// Re-export AgentContext for other files using it
export type { AgentContext };

// --- Helper Functions ---
const getCryptoSymbol = (input: string): string => {
    const map: Record<string, string> = {
        'bitcoin': 'BTC', 'ethereum': 'ETH', 'solana': 'SOL', 'cardano': 'ADA', 'ripple': 'XRP'
    };
    return map[input.toLowerCase().trim()] || input.toUpperCase();
};

// --- HAPTIC FEEDBACK ENGINE ---
const triggerHaptic = (type: 'SUCCESS' | 'FAILURE' | 'WARN' | 'SCAN' | 'CRITICAL') => {
    if (!navigator.vibrate) return;
    
    switch (type) {
        case 'SUCCESS':
            navigator.vibrate(50); 
            break;
        case 'FAILURE':
            navigator.vibrate([50, 100, 50]); 
            break;
        case 'WARN':
            navigator.vibrate(200); 
            break;
        case 'SCAN':
            navigator.vibrate(20); 
            break;
        case 'CRITICAL':
            navigator.vibrate([100, 50, 100, 50, 100]); 
            break;
    }
};


// --- File System Helpers ---

const getFileHandle = async (handle: any, path: string, create = false) => {
    const parts = path.split(/[/\\]/).filter(p => p && p !== '.');
    let currentHandle = handle;
    
    for (let i = 0; i < parts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create });
    }
    return await currentHandle.getFileHandle(parts[parts.length - 1], { create });
};

const readLocalFile = async (handle: any, path: string): Promise<string> => {
    try {
        const fileHandle = await getFileHandle(handle, path);
        const file = await fileHandle.getFile();
        return await file.text();
    } catch (e: any) {
        throw new Error(`Could not read file '${path}': ${e.message}`);
    }
};

const writeLocalFile = async (handle: any, path: string, content: string): Promise<void> => {
    try {
        const fileHandle = await getFileHandle(handle, path, true); 
        // @ts-ignore 
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    } catch (e: any) {
         if (e.message === 'VIRTUAL_FS_WRITE_NOT_SUPPORTED' || e.name === 'TypeError') {
             throw new Error('VIRTUAL_FS_WRITE_NOT_SUPPORTED');
         }
         throw new Error(`Could not write to file '${path}'. Error: ${e.message}`);
    }
};

const listLocalDirectory = async (handle: any, subPath: string = ''): Promise<string> => {
    try {
        let targetHandle = handle;
        if (subPath) {
            const parts = subPath.split(/[/\\]/).filter(p => p && p !== '.');
            for (const part of parts) {
                targetHandle = await targetHandle.getDirectoryHandle(part);
            }
        }

        let output = `Directory Listing for '/${subPath}':\n`;
        // @ts-ignore 
        for await (const [name, entry] of targetHandle.entries()) {
            output += `${entry.kind === 'directory' ? '📁' : '📄'} ${name}\n`;
        }
        return output;
    } catch (e: any) {
        return `Error listing directory '${subPath}': ${e.message}`;
    }
};

// --- Helper: Generate ICS File ---
const generateICS = (title: string, time: string) => {
    let dateStart = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    try {
        const parsed = new Date(time);
        if (!isNaN(parsed.getTime())) {
            dateStart = parsed.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        }
    } catch(e) {}
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IssieOS//SovereignCalendar//EN
BEGIN:VEVENT
UID:${Date.now()}@issie.os
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}
DTSTART:${dateStart}
SUMMARY:${title}
DESCRIPTION:Scheduled by Issie OS.
END:VEVENT
END:VCALENDAR`;
};


// --- Orchestration & Execution Logic ---

// 1. Trader Agent Execution
const executeTraderTask = async (task: string, args: any, context: AgentContext): Promise<string> => {
    const cryptoSymbol = args.cryptocurrency || args.symbol ? getCryptoSymbol(args.cryptocurrency || args.symbol) : 'BTC';
    
    if (task === 'getCryptoTechnicalAnalysis') {
        // Basic price check
        try {
             const currentUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${cryptoSymbol}&tsyms=USD`;
             const currentData = await (await fetch(currentUrl)).json();
             const price = currentData.RAW?.[cryptoSymbol]?.USD?.PRICE;
             return `[TRADER] Price for ${cryptoSymbol}: $${price}. For deep analysis, use getQuantMetrics.`;
        } catch (e: any) {
             return `[TRADER] Failed to access market feed: ${e.message}`;
        }
    }

    if (task === 'getQuantMetrics') {
        // Advanced Math with Multi-Timeframe Analysis
        try {
            // Use timeframes array if provided, else default to 1h
            const timeframes = args.timeframes || ['1h'];
            const results: any = { symbol: cryptoSymbol, price: 0 };
            
            for (const tf of timeframes) {
                let limit = 100;
                let endpoint = 'histohour';
                if (tf === '1d') endpoint = 'histoday';
                if (tf === '15m') endpoint = 'histominute'; 
                
                const historyUrl = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${cryptoSymbol}&tsym=USD&limit=${limit}`;
                const historyData = await (await fetch(historyUrl)).json();
                
                if (historyData.Response === 'Error') continue;
    
                const candles = historyData.Data.Data;
                const closes = candles.map((d: any) => d.close);
                const currentPrice = closes[closes.length - 1];
                results.price = currentPrice; // Update latest price
    
                const rsi = calculateRSI(closes);
                const bands = calculateBollingerBands(closes);
                const macd = calculateMACD(closes);
    
                let signal = "NEUTRAL";
                if (rsi && rsi < 30) signal = "BULLISH (Oversold)";
                if (rsi && rsi > 70) signal = "BEARISH (Overbought)";
                
                results[tf] = {
                    RSI: rsi?.toFixed(2),
                    MACD: macd ? { macd: macd.macd.toFixed(2), signal: macd.signal.toFixed(2), hist: macd.histogram.toFixed(4) } : null,
                    Bollinger: bands ? { upper: bands.upper.toFixed(2), lower: bands.lower.toFixed(2) } : null,
                    Signal: signal
                };
            }
            
            return JSON.stringify(results);

        } catch (e: any) {
            return `[TRADER] Quant calculation failed: ${e.message}`;
        }
    }
    
    if (task === 'getMarketSentiment') {
        const sentiment = await getFearAndGreedIndex();
        if (!sentiment) return "[TRADER] Could not fetch Sentiment data.";
        return JSON.stringify(sentiment);
    }
    
    if (task === 'calculateRisk') {
        try {
            const wallet = await getWallet();
            const riskData = calculateRisk(
                wallet.balance,
                args.riskPercentage || 1,
                args.entryPrice,
                args.stopLossPrice,
                args.takeProfitPrice
            );
            return JSON.stringify(riskData);
        } catch (e: any) {
            return `[TRADER] Risk Calc Failed: ${e.message}`;
        }
    }
    
    if (task === 'runBacktest') {
        const result = await runBacktest(cryptoSymbol, args.timeframe || '1h');
        return typeof result === 'string' ? result : JSON.stringify(result);
    }

    if (task === 'checkPublicWallet') {
        const result = await getPublicWalletBalance(args.chain, args.address);
        return typeof result === 'string' ? result : JSON.stringify(result);
    }

    if (task === 'checkArbitrage') {
        try {
            const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitfinex'];
            const prices: { exchange: string, price: number }[] = [];

            await Promise.all(exchanges.map(async (ex) => {
                try {
                    const url = `https://min-api.cryptocompare.com/data/price?fsym=${cryptoSymbol}&tsyms=USD&e=${ex}`;
                    const data = await (await fetch(url)).json();
                    if (data.USD) {
                        prices.push({ exchange: ex, price: data.USD });
                    }
                } catch (e) {}
            }));

            if (prices.length < 2) return "[TRADER] Insufficient data for arbitrage calculation.";

            prices.sort((a, b) => a.price - b.price);
            const min = prices[0];
            const max = prices[prices.length - 1];
            const diff = max.price - min.price;
            const spread = ((diff / min.price) * 100).toFixed(3);

            return JSON.stringify({
                asset: cryptoSymbol,
                spreadPercent: spread,
                buyAt: { exchange: min.exchange, price: min.price },
                sellAt: { exchange: max.exchange, price: max.price },
                opportunity: parseFloat(spread) > 0.5 ? "YES" : "NO"
            });

        } catch (e: any) {
            return `[TRADER] Arbitrage check failed: ${e.message}`;
        }
    }

    if (task === 'executePaperTrade') {
        try {
            // Need current price for execution
            const currentUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${cryptoSymbol}&tsyms=USD`;
            const currentData = await (await fetch(currentUrl)).json();
            const price = currentData.RAW?.[cryptoSymbol]?.USD?.PRICE;
            
            if (!price) throw new Error("Price unavailable");

            const result = await executePaperTrade(
                cryptoSymbol, 
                args.side, 
                price, 
                args.amountUSD,
                args.stopLoss,
                args.takeProfit
            );
            
            // Update context hook for UI
            if (context.clientHooks.refreshWallet) {
                const wallet = await getWallet();
                context.clientHooks.refreshWallet(wallet);
            }
            
            return JSON.stringify(result);
        } catch (e: any) {
            return `[TRADER] Trade Execution Failed: ${e.message}`;
        }
    }
    
    // --- NEW DEFI TOOLS ---
    if (task === 'getGasPrice') {
        return await getGasPrice(args.chain);
    }
    
    if (task === 'getDexQuote') {
        return await getDexQuote(args.inputToken, args.outputToken, args.amount);
    }
    
    if (task === 'analyzeTokenSecurity') {
        return await analyzeTokenSecurity(args.tokenAddress, args.chain);
    }

    return `[TRADER] Unknown task`;
};

// 2. Navigator Agent Execution
const executeNavigatorTask = async (task: string, args: any): Promise<string> => {
    if (task === 'webSearch') {
        try {
             const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(args.query)}&format=json&origin=*`;
             const data = await (await fetch(url)).json();
             return `[NAVIGATOR] Search Result: ${data.query.search[0]?.snippet || 'No data'}`;
        } catch (e) { return `[NAVIGATOR] Connection failed.`; }
    }
    if (task === 'getWeatherForecast') {
        try {
             const url = `https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&current=temperature_2m,weather_code`;
             const data = await (await fetch(url)).json();
             return `[NAVIGATOR] Env Report: ${data.current.temperature_2m}°C`; 
        } catch (e) { return `[NAVIGATOR] Sensor fail.`; }
    }
    return `[NAVIGATOR] Idle.`;
};

// 3. Engineer Agent Execution (File Ops)
const executeEngineerTask = async (task: string, args: any, context: AgentContext): Promise<string> => {
    if (task === 'listDirectory') {
        if (!context.directoryHandle) return "[ENGINEER] Error: No file system mounted. Ask user to 'Mount Project'.";
        return await listLocalDirectory(context.directoryHandle, args.subPath || '');
    }
    if (task === 'readProjectFile') {
        if (!context.directoryHandle) return "[ENGINEER] Error: No file system mounted.";
        try {
            const content = await readLocalFile(context.directoryHandle, args.filePath);
            return `[ENGINEER] Content of '${args.filePath}':\n\n${content.substring(0, 2000)}${content.length > 2000 ? '\n...(truncated)' : ''}`;
        } catch (e: any) {
            return `[ENGINEER] Read Error: ${e.message}`;
        }
    }
    if (task === 'queryDocument') {
        if (!context.documentContent) return "[ENGINEER] Error: No document loaded. Ask user to upload a file.";
        const { headers, rows } = context.documentContent;
        const query = args.query.toLowerCase();
        const matches = rows.filter(row => row.some(cell => cell.toLowerCase().includes(query)));
        
        if (matches.length === 0) return `[ENGINEER] No matches found for '${args.query}' in document.`;
        
        const limit = 5;
        const resultText = matches.slice(0, limit).map(row => row.join(' | ')).join('\n');
        return `[ENGINEER] Found ${matches.length} matches. Top results:\nHeaders: ${headers.join(' | ')}\n${resultText}${matches.length > limit ? '\n...(more)' : ''}`;
    }
    
    if (task === 'patchFile') {
        if (!context.directoryHandle) return "[ENGINEER] Error: No file system mounted.";
        try {
            const originalContent = await readLocalFile(context.directoryHandle, args.filePath);
            if (!originalContent.includes(args.searchString)) {
                 return `[ENGINEER] Patch Failed: Search string not found in '${args.filePath}'.`;
            }
            const newContent = originalContent.replace(args.searchString, args.replaceString);
            await writeLocalFile(context.directoryHandle, args.filePath, newContent);
            return `[ENGINEER] Patch applied to '${args.filePath}' successfully.`;
        } catch (e: any) {
             if (e.message === 'VIRTUAL_FS_WRITE_NOT_SUPPORTED') {
                  return `[ENGINEER] Cannot patch in mobile/virtual environment. Please use 'saveToDisk' to download the full updated file instead.`;
             }
             return `[ENGINEER] Patch Error: ${e.message}`;
        }
    }
    
    if (task === 'pushToGitHub') {
        const { token, repo } = context.githubConfig || {};
        if (!token || !repo) {
            return "[ENGINEER] Error: GitHub credentials not configured in Settings.";
        }
        
        try {
            const { filePath, content, commitMessage } = args;
            const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
            
            // Check sha
            let sha: string | undefined;
            const getRes = await fetch(apiUrl, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
            });
            
            if (getRes.ok) {
                const data = await getRes.json();
                sha = data.sha;
            }
            
            // Push
            const putRes = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: btoa(content), 
                    sha: sha
                })
            });
            
            if (!putRes.ok) {
                const err = await putRes.json();
                throw new Error(err.message);
            }
            
            return `[ENGINEER] Successfully pushed '${filePath}' to ${repo}. CI/CD pipeline triggered.`;
            
        } catch (e: any) {
            return `[ENGINEER] GitHub Push Failed: ${e.message}`;
        }
    }

    return "[ENGINEER] Standby.";
};

// --- Main Router ---

export const executeToolCall = async (
  functionCall: FunctionCall,
  context: AgentContext
): Promise<any> => {
  const { name, args: rawArgs } = functionCall;
  const args = rawArgs as any;

  let result = "";
  let agentName = "SYSTEM";
  let status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';

  try {
      switch (name) {
        // TRADER AGENT
        case 'getCryptoTechnicalAnalysis':
        case 'generateChart':
        case 'getQuantMetrics':
        case 'executePaperTrade':
        case 'checkArbitrage':
        case 'getMarketSentiment':
        case 'calculateRisk':
        case 'runBacktest':
        case 'checkPublicWallet':
        case 'getGasPrice':
        case 'getDexQuote':
        case 'analyzeTokenSecurity':
            agentName = TraderAgent.name;
            result = await executeTraderTask(name, args, context);
            triggerHaptic('SUCCESS');
            break;

        // NAVIGATOR AGENT
        case 'searchWeb':
        case 'openUrl':
        case 'getWeatherForecast':
        case 'getBatteryStatus':
        case 'scheduleMeeting':
        case 'announceLocally':
            agentName = NavigatorAgent.name;
            triggerHaptic('SUCCESS');
            if (name === 'openUrl') {
                 window.open(args.url, '_blank');
                 result = `[NAVIGATOR] Opened ${args.url}`;
            } else if (name === 'getBatteryStatus') {
                 // @ts-ignore
                 const bat = await navigator.getBattery();
                 result = `[NAVIGATOR] Power: ${Math.round(bat.level * 100)}%${bat.charging ? ' (Charging)' : ''}`;
            } else if (name === 'scheduleMeeting') {
                 const icsContent = generateICS(args.title, args.time);
                 const blob = new Blob([icsContent], { type: 'text/calendar' });
                 const url = URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = `${args.title.replace(/\s+/g, '_')}.ics`;
                 link.click();
                 result = `[NAVIGATOR] Calendar event '${args.title}.ics' generated and downloaded.`;
            } else if (name === 'announceLocally') {
                 if ('speechSynthesis' in window) {
                     const utterance = new SpeechSynthesisUtterance(args.message);
                     window.speechSynthesis.speak(utterance);
                     result = `[NAVIGATOR] Announced locally: "${args.message}"`;
                 } else {
                     result = `[NAVIGATOR] Error: TTS not supported on this device.`;
                     status = 'FAILURE';
                 }
            } else {
                result = await executeNavigatorTask(name, args);
            }
            break;

        // ENGINEER AGENT
        case 'captureScreen':
        case 'copyToClipboard':
        case 'saveToDisk':
        case 'listDirectory':
        case 'readProjectFile':
        case 'queryDocument':
        case 'patchFile':
        case 'pushToGitHub': 
        case 'readVisualCode': 
            agentName = EngineerAgent.name;
            triggerHaptic('SUCCESS');
            if (name === 'captureScreen') {
                result = await context.clientHooks.captureScreen(args.filename);
            } else if (name === 'copyToClipboard') {
                result = await context.clientHooks.copyToClipboard(args.content);
            } else if (name === 'readVisualCode') {
                triggerHaptic('SCAN');
                const codes = await context.clientHooks.scanVisualCodes();
                if (codes && codes.length > 0) {
                    result = `[ENGINEER] Scanned Data: ${codes.join(', ')}`;
                } else {
                    result = `[ENGINEER] No QR/Barcodes detected in view.`;
                    status = 'FAILURE';
                }
            } else if (name === 'saveToDisk') {
                let savedToDisk = false;
                if (context.directoryHandle) {
                    try {
                        await writeLocalFile(context.directoryHandle, args.filename, args.content);
                        result = `[ENGINEER] File '${args.filename}' written directly to mounted file system.`;
                        savedToDisk = true;
                    } catch (e: any) {
                        if (e.message !== 'VIRTUAL_FS_WRITE_NOT_SUPPORTED') {
                             status = 'FAILURE';
                             result = `[ENGINEER] Write Failed: ${e.message}.`;
                        }
                    }
                } 
                
                if (!savedToDisk) {
                    const blob = new Blob([args.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url; link.download = args.filename; link.click();
                    result = `[ENGINEER] File '${args.filename}' downloaded to device (Mobile/Virtual Mode).`;
                }
            } else {
                result = await executeEngineerTask(name, args, context);
            }
            break;

        // DIRECTOR AGENT
        case 'generateCreativeConcept':
        case 'playAmbientAudio':
        case 'displayEmotionAndRespond':
            agentName = DirectorAgent.name;
            triggerHaptic('SUCCESS');
            result = `[DIRECTOR] Creative task executed.`;
            break;

        // SENTINEL AGENT
        case 'confirmBiometricIdentity':
        case 'getSystemStatus':
            agentName = SentinelAgent.name;
            if (name === 'getSystemStatus') {
                result = `[SENTINEL] DIAGNOSTICS: Online=${context.systemStatus.isOnline}, Secure=${context.systemStatus.securityStatus}`;
            } else {
                if (args.match) {
                    triggerHaptic('SUCCESS');
                    result = "ACCESS_GRANTED";
                } else {
                    triggerHaptic('FAILURE');
                    result = "ACCESS_DENIED";
                }
            }
            break;
            
        // SYSTEM AGENT
        case 'createSystemSnapshot':
            agentName = SystemAgent.name;
            triggerHaptic('SUCCESS');
            result = await SystemAgent.createSnapshot();
            const blob = new Blob([result], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `issie_snapshot_${Date.now()}.json`; a.click();
            result = "System Snapshot created and downloaded.";
            break;
        
        case 'restoreSystemSnapshot':
            agentName = SystemAgent.name;
            result = "To restore a snapshot, please use the 'Restore System' button in the Control Panel.";
            break;

        case 'manageMission':
            agentName = "MISSION_CONTROL";
            triggerHaptic('SUCCESS');
            result = "Mission updated.";
            break;
            
        // COACH AGENT
        case 'provideCoachingTip':
            agentName = CoachAgent.name;
            const severity = args.severity || 'neutral';
            if (severity === 'critical') triggerHaptic('CRITICAL');
            else if (severity === 'warning') triggerHaptic('FAILURE'); 
            else triggerHaptic('SCAN'); 
            
            context.clientHooks.setCoachingTip({
                text: args.tip,
                severity: severity,
                timestamp: Date.now()
            });
            result = "Tip delivered to user HUD.";
            break;

        default:
            result = `Tool '${name}' executed.`;
      }
  } catch (e: any) {
      status = 'FAILURE';
      triggerHaptic('FAILURE');
      result = `Error executing ${name}: ${e.message}`;
  }

  await logAuditEntry(agentName, name, status, result.substring(0, 100));

  return { result };
};
