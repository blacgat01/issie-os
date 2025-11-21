
import { calculateRSI, calculateBollingerBands } from './indicators';

interface BacktestResult {
    strategy: string;
    totalTrades: number;
    winningTrades: number;
    winRate: string;
    initialBalance: number;
    finalBalance: number;
    profitFactor: number;
    pnlPercent: string;
    log: string[];
}

/**
 * Runs a simulation on historical data.
 * Currently supports a simple RSI Mean Reversion strategy.
 */
export const runBacktest = async (
    symbol: string, 
    timeframe: '1h' | '4h' | '1d', 
    period: number = 30 // Days of data
): Promise<BacktestResult | string> => {
    try {
        // 1. Fetch Historical Data
        const limit = period * (timeframe === '1d' ? 1 : timeframe === '4h' ? 6 : 24);
        const endpoint = timeframe === '1d' ? 'histoday' : 'histohour';
        const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=USD&limit=${limit}`;
        const response = await (await fetch(url)).json();

        if (response.Response === 'Error') return `Data fetch failed for ${symbol}`;

        const candles = response.Data.Data; // Array of { time, open, high, low, close }
        const closes = candles.map((c: any) => c.close);

        // 2. Initialize Simulation State
        let balance = 10000; // Start with $10k
        let position: { entry: number, amount: number } | null = null;
        let wins = 0;
        let trades = 0;
        const tradeLog: string[] = [];

        // 3. Run Loop
        // We need at least 14 data points for RSI
        for (let i = 14; i < closes.length; i++) {
            const price = closes[i];
            const time = new Date(candles[i].time * 1000).toLocaleDateString();
            
            // Calculate Indicators for this slice of time
            const pastPrices = closes.slice(0, i + 1);
            const rsi = calculateRSI(pastPrices);

            // Strategy: RSI Mean Reversion
            // BUY if RSI < 30
            // SELL if RSI > 70
            
            if (!position && rsi && rsi < 30) {
                // ENTER LONG
                const amount = balance / price;
                position = { entry: price, amount };
                balance = 0; // All in
                // tradeLog.push(`[${time}] BUY @ $${price} (RSI: ${rsi.toFixed(2)})`);
            } 
            else if (position && rsi && rsi > 70) {
                // EXIT LONG
                const value = position.amount * price;
                const pnl = value - (position.amount * position.entry);
                balance = value;
                
                trades++;
                if (pnl > 0) wins++;
                
                position = null;
                // tradeLog.push(`[${time}] SELL @ $${price} (RSI: ${rsi.toFixed(2)}) PnL: ${pnl.toFixed(2)}`);
            }
        }

        // Close open position at end
        if (position) {
            const price = closes[closes.length - 1];
            balance = position.amount * price;
            trades++; // Count as trade for stats
        }

        const initialBalance = 10000;
        const pnlPercent = ((balance - initialBalance) / initialBalance) * 100;

        return {
            strategy: "RSI Mean Reversion (Buy < 30, Sell > 70)",
            totalTrades: trades,
            winningTrades: wins,
            winRate: trades > 0 ? ((wins / trades) * 100).toFixed(1) + '%' : '0%',
            initialBalance,
            finalBalance: parseFloat(balance.toFixed(2)),
            profitFactor: parseFloat((balance / initialBalance).toFixed(2)),
            pnlPercent: pnlPercent.toFixed(2) + '%',
            log: tradeLog.slice(-5) // Return last 5 trades to save context
        };

    } catch (e: any) {
        return `Backtest Error: ${e.message}`;
    }
};
