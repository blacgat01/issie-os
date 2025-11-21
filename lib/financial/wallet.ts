
// Sovereign Paper Wallet
// Tracks simulated trades to prove strategy viability before risking real capital.

import { secureStorage } from '../security';

export interface Position {
    id: string;
    symbol: string;
    entryPrice: number;
    amount: number;
    side: 'LONG' | 'SHORT';
    timestamp: number;
    status: 'OPEN' | 'CLOSED';
    exitPrice?: number;
    pnl?: number;
    stopLoss?: number;
    takeProfit?: number;
}

export interface WalletState {
    balance: number; // USDT
    positions: Position[];
    tradeHistory: Position[];
}

const INITIAL_BALANCE = 10000; // Start with $10k simulated

export const getWallet = async (): Promise<WalletState> => {
    const stored = await secureStorage.getItem('paper_wallet');
    if (stored) return stored;
    
    const newWallet: WalletState = {
        balance: INITIAL_BALANCE,
        positions: [],
        tradeHistory: []
    };
    await secureStorage.setItem('paper_wallet', newWallet);
    return newWallet;
};

export const executePaperTrade = async (
    symbol: string, 
    side: 'BUY' | 'SELL', 
    currentPrice: number, 
    amountUSD: number,
    stopLoss?: number,
    takeProfit?: number
): Promise<any> => {
    const wallet = await getWallet();
    
    if (side === 'BUY') {
        if (wallet.balance < amountUSD) return { error: "INSUFFICIENT_FUNDS" };
        
        const position: Position = {
            id: Date.now().toString(),
            symbol,
            entryPrice: currentPrice,
            amount: amountUSD / currentPrice, // Token amount
            side: 'LONG',
            timestamp: Date.now(),
            status: 'OPEN',
            stopLoss,
            takeProfit
        };
        
        wallet.balance -= amountUSD;
        wallet.positions.push(position);
        await secureStorage.setItem('paper_wallet', wallet);
        
        return {
            type: 'TRADE_RECEIPT',
            action: 'OPEN',
            symbol,
            side: 'LONG',
            entryPrice: currentPrice,
            amount: position.amount.toFixed(4),
            valueUSD: amountUSD,
            stopLoss: stopLoss || 'N/A',
            takeProfit: takeProfit || 'N/A'
        };
    } 
    else if (side === 'SELL') {
        // Find open position
        const posIndex = wallet.positions.findIndex(p => p.symbol === symbol && p.status === 'OPEN');
        if (posIndex === -1) return { error: "NO_OPEN_POSITION" };
        
        const pos = wallet.positions[posIndex];
        const exitValue = pos.amount * currentPrice;
        const pnl = exitValue - (pos.amount * pos.entryPrice);
        
        pos.status = 'CLOSED';
        pos.exitPrice = currentPrice;
        pos.pnl = pnl;
        
        wallet.balance += exitValue;
        wallet.positions.splice(posIndex, 1); // Remove from active
        wallet.tradeHistory.push(pos); // Add to history
        
        await secureStorage.setItem('paper_wallet', wallet);
        
        return {
            type: 'TRADE_RECEIPT',
            action: 'CLOSE',
            symbol,
            side: 'LONG', // We only support Longs for now in paper trade logic
            exitPrice: currentPrice,
            pnl: pnl.toFixed(2),
            pnlPercent: ((pnl / (pos.amount * pos.entryPrice)) * 100).toFixed(2) + '%'
        };
    }
    return { error: "INVALID_SIDE" };
};
