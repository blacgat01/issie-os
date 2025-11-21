
// Sovereign Quant Engine
// Pure Math implementation of standard trading indicators
// No external libraries required - runs 100% offline

export const calculateRSI = (prices: number[], period: number = 14): number | null => {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smooth subsequent steps
    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
        }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
    if (prices.length < period) return null;

    const slice = prices.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    
    const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(variance);

    return {
        upper: mean + (sd * stdDev),
        middle: mean,
        lower: mean - (sd * stdDev)
    };
};

export const calculateMACD = (prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (prices.length < slowPeriod + signalPeriod) return null;

    const calculateEMA = (data: number[], period: number) => {
        const k = 2 / (period + 1);
        let ema = data[0];
        const emas = [ema];
        for (let i = 1; i < data.length; i++) {
            ema = data[i] * k + ema * (1 - k);
            emas.push(ema);
        }
        return emas;
    };

    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);

    // MACD Line = Fast - Slow
    const macdLine = fastEMA.map((val, i) => val - slowEMA[i]).slice(slowPeriod - 1);
    
    // Signal Line = 9-day EMA of MACD Line
    const signalLine = calculateEMA(macdLine, signalPeriod);

    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = signalLine[signalLine.length - 1];

    return {
        macd: currentMACD,
        signal: currentSignal,
        histogram: currentMACD - currentSignal
    };
};
