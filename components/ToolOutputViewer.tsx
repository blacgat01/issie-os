
import React from 'react';
import { ChartBarIcon, BoltIcon, ShieldCheckIcon, CurrencyDollarIcon } from './icons';

interface ToolOutputViewerProps {
    jsonContent: string;
}

const ToolOutputViewer: React.FC<ToolOutputViewerProps> = ({ jsonContent }) => {
    let data: any;
    try {
        data = JSON.parse(jsonContent);
    } catch (e) {
        return null;
    }

    // --- TRADE RECEIPT VIEWER ---
    if (data.type === 'TRADE_RECEIPT') {
        const isClosed = data.action === 'CLOSE';
        const pnlValue = parseFloat(data.pnl || '0');
        const isProfit = pnlValue >= 0;

        return (
            <div className="mt-2 border border-gray-700 bg-gray-800/50 rounded-lg overflow-hidden max-w-sm">
                <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center ${isClosed ? 'bg-blue-900/20 text-blue-300' : 'bg-emerald-900/20 text-emerald-300'}`}>
                    <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>{isClosed ? 'Position Closed' : 'Trade Executed'}</span>
                    </div>
                    <span>{data.symbol}</span>
                </div>
                
                <div className="p-3 space-y-3 text-sm">
                    <div className="flex justify-between items-baseline border-b border-gray-700 pb-2">
                        <span className="text-gray-400 text-xs">{data.side}</span>
                        <span className="font-mono font-bold text-lg text-white">{data.amount} units</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="block text-gray-500 uppercase text-[10px]">Price</span>
                            <span className="font-mono text-gray-200">${data.entryPrice || data.exitPrice}</span>
                        </div>
                        <div className="text-right">
                            {isClosed ? (
                                <>
                                    <span className="block text-gray-500 uppercase text-[10px]">PnL</span>
                                    <span className={`font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {data.pnlPercent} ({data.pnl})
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="block text-gray-500 uppercase text-[10px]">Value</span>
                                    <span className="font-mono text-gray-200">${parseFloat(data.valueUSD).toFixed(2)}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {!isClosed && (
                         <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                             <div className="bg-red-900/10 border border-red-900/30 rounded px-2 py-1 text-red-300 text-center">
                                 SL: {data.stopLoss}
                             </div>
                             <div className="bg-green-900/10 border border-green-900/30 rounded px-2 py-1 text-green-300 text-center">
                                 TP: {data.takeProfit}
                             </div>
                         </div>
                    )}
                </div>
            </div>
        );
    }

    // --- ARBITRAGE VIEWER ---
    if (data.spreadPercent && data.buyAt && data.sellAt) {
        const isOpportunity = data.opportunity === "YES";
        return (
            <div className={`mt-2 border rounded-lg overflow-hidden ${isOpportunity ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-gray-700 bg-gray-800/30'}`}>
                <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider flex justify-between ${isOpportunity ? 'bg-emerald-900/30 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}>
                    <span>Arbitrage Scanner</span>
                    <span>{data.asset}</span>
                </div>
                <div className="p-3 text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Spread</span>
                        <span className={`font-mono font-bold ${isOpportunity ? 'text-emerald-400' : 'text-gray-300'}`}>{data.spreadPercent}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
                            <span className="block text-gray-500 mb-1">Buy At</span>
                            <div className="font-bold text-blue-300">{data.buyAt.exchange}</div>
                            <div className="font-mono text-gray-300">${data.buyAt.price}</div>
                        </div>
                        <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50">
                            <span className="block text-gray-500 mb-1">Sell At</span>
                            <div className="font-bold text-purple-300">{data.sellAt.exchange}</div>
                            <div className="font-mono text-gray-300">${data.sellAt.price}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- BACKTEST VIEWER ---
    if (data.strategy && data.winRate && data.finalBalance) {
        const isProfitable = data.finalBalance > data.initialBalance;
        return (
            <div className="mt-2 border border-gray-700 bg-gray-800/30 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4" />
                    Strategy Backtest
                </div>
                <div className="p-3 space-y-3">
                    <div className="text-sm font-medium text-blue-300">{data.strategy}</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-900/50 p-2 rounded">
                            <span className="block text-[10px] text-gray-500 uppercase">Win Rate</span>
                            <span className="font-mono font-bold text-gray-200">{data.winRate}</span>
                        </div>
                        <div className="bg-gray-900/50 p-2 rounded">
                            <span className="block text-[10px] text-gray-500 uppercase">Trades</span>
                            <span className="font-mono font-bold text-gray-200">{data.totalTrades}</span>
                        </div>
                        <div className="bg-gray-900/50 p-2 rounded">
                            <span className="block text-[10px] text-gray-500 uppercase">Profit</span>
                            <span className={`font-mono font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>{data.pnlPercent}</span>
                        </div>
                    </div>
                    {data.log && data.log.length > 0 && (
                         <div className="text-[10px] font-mono text-gray-500 bg-black/20 p-2 rounded max-h-20 overflow-y-auto">
                             {data.log.map((l: string, i: number) => <div key={i}>{l}</div>)}
                         </div>
                    )}
                </div>
            </div>
        );
    }

    // --- SENTIMENT VIEWER ---
    if (data.classification && data.value !== undefined) {
        const color = data.value > 75 ? 'text-emerald-400' : data.value < 25 ? 'text-red-400' : 'text-yellow-400';
        return (
            <div className="mt-2 inline-flex items-center gap-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded-full">
                <span className="text-xs font-bold text-gray-500 uppercase">Market Mood</span>
                <div className="flex items-center gap-2">
                    <span className={`font-bold ${color}`}>{data.classification}</span>
                    <span className="text-xs font-mono text-gray-400">({data.value}/100)</span>
                </div>
            </div>
        );
    }
    
    // --- DEX QUOTE VIEWER ---
    if (data.dex && data.priceImpact) {
        return (
            <div className="mt-2 border border-purple-500/30 bg-purple-900/10 rounded-lg overflow-hidden">
                 <div className="px-3 py-2 bg-purple-900/20 text-purple-300 text-xs font-bold uppercase tracking-wider flex justify-between">
                    <span>DEX Quote</span>
                    <span>{data.dex}</span>
                </div>
                <div className="p-3 text-sm grid grid-cols-2 gap-4">
                     <div>
                         <span className="block text-xs text-gray-500 mb-1">Swap</span>
                         <div className="font-mono text-gray-200">{data.inputAmount} {data.pair.split('/')[0]}</div>
                         <div className="text-xs text-gray-500">↓</div>
                         <div className="font-mono text-emerald-300 font-bold">{data.outputAmount} {data.pair.split('/')[1]}</div>
                     </div>
                     <div className="text-right">
                          <span className="block text-xs text-gray-500 mb-1">Implied Price</span>
                          <div className="font-mono text-gray-200">${data.impliedPrice}</div>
                          <span className="block text-xs text-gray-500 mt-1">Impact: <span className="text-yellow-500">{data.priceImpact}</span></span>
                     </div>
                </div>
            </div>
        );
    }
    
    // --- QUANT METRICS (RSI/MACD) ---
    if (data.symbol && data['1h']) {
        return (
            <div className="mt-2 border border-gray-700 bg-gray-800/50 rounded-lg overflow-hidden text-xs">
                <div className="px-3 py-2 bg-gray-800 text-gray-400 font-bold uppercase flex justify-between">
                    <span>Quant Scan</span>
                    <span className="text-white">{data.symbol} ${data.price}</span>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-500 border-b border-gray-700">
                            <th className="p-2">TF</th>
                            <th className="p-2">RSI</th>
                            <th className="p-2">MACD</th>
                            <th className="p-2">Signal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(data).filter(k => ['15m', '1h', '4h', '1d'].includes(k)).map(tf => (
                            <tr key={tf} className="border-b border-gray-700/50">
                                <td className="p-2 font-mono text-blue-300">{tf}</td>
                                <td className="p-2 font-mono text-gray-300">{data[tf].RSI}</td>
                                <td className="p-2 font-mono text-gray-300">{data[tf].MACD ? data[tf].MACD.hist : '-'}</td>
                                <td className="p-2 font-bold">{data[tf].Signal}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Default: No structured view found
    return null;
};

export default ToolOutputViewer;
