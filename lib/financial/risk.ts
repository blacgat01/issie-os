

// Sovereign Risk Manager
// Calculates optimal position sizes to preserve capital.

export interface RiskCalculation {
    riskPerShare: number;
    positionSizeUnits: number;
    positionSizeUSD: number;
    riskRewardRatio: number;
}

/**
 * Calculates position size based on account balance and risk tolerance.
 * @param accountBalance Total wallet balance (USD)
 * @param riskPercentage Percent of account to risk per trade (e.g., 1.0 for 1%)
 * @param entryPrice Price entering the trade
 * @param stopLossPrice Price where trade is invalid
 * @param takeProfitPrice Target price
 */
export const calculateRisk = (
    accountBalance: number,
    riskPercentage: number,
    entryPrice: number,
    stopLossPrice: number,
    takeProfitPrice: number
): RiskCalculation => {
    const riskAmount = accountBalance * (riskPercentage / 100);
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    
    if (riskPerShare === 0) {
        throw new Error("Stop Loss cannot equal Entry Price");
    }

    // How many units can we buy such that if it hits SL, we lose exactly riskAmount?
    const positionSizeUnits = riskAmount / riskPerShare;
    const positionSizeUSD = positionSizeUnits * entryPrice;

    const rewardPerShare = Math.abs(takeProfitPrice - entryPrice);
    const riskRewardRatio = rewardPerShare / riskPerShare;

    return {
        riskPerShare,
        positionSizeUnits,
        positionSizeUSD,
        riskRewardRatio
    };
};