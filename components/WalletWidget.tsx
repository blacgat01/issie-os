
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { CurrencyDollarIcon, ChartBarIcon } from './icons';
import { getWallet } from '../lib/financial/wallet';

const WalletWidget: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { paperWallet } = state;

    // Poll wallet state occasionally or rely on tool execution to update it
    useEffect(() => {
        const fetchWallet = async () => {
            const w = await getWallet();
            dispatch({ type: 'SET_PAPER_WALLET', payload: w });
        };
        fetchWallet();
        
        // Refresh every 10s just in case background processes update it
        const interval = setInterval(fetchWallet, 10000);
        return () => clearInterval(interval);
    }, [dispatch]);

    if (!paperWallet) return null;

    const { balance, positions } = paperWallet;
    
    // Calculate approximate unrealized PnL (simulated for now, would need live price fetching)
    const activePositions = positions.filter(p => p.status === 'OPEN');
    const investedAmount = activePositions.reduce((sum, p) => sum + (p.amount * p.entryPrice), 0);
    
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                    <CurrencyDollarIcon className="w-5 h-5" />
                    <span className="text-sm font-bold tracking-wider">TRADING DESK</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">PAPER ACCT</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-gray-400">Available Cash</p>
                    <p className="text-lg font-bold text-white font-mono">${balance.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Active Value</p>
                    <p className="text-lg font-bold text-blue-300 font-mono">${investedAmount.toFixed(2)}</p>
                </div>
            </div>
            
            {activePositions.length > 0 ? (
                <div className="space-y-2 mt-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Open Positions</p>
                    {activePositions.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs bg-gray-700/30 p-2 rounded border border-gray-700">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${p.side === 'LONG' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="font-bold text-gray-200">{p.symbol}</span>
                                <span className="text-gray-500 text-[10px]">{p.side}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-gray-300 font-mono">{p.amount.toFixed(4)} units</span>
                                <span className="block text-gray-500 font-mono">@ ${p.entryPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-xs text-gray-500 italic text-center py-1">No active positions</div>
            )}
        </div>
    );
};

export default WalletWidget;
