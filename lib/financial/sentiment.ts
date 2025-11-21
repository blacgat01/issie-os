
// Sovereign Sentiment Engine
// Fetches global market sentiment (Fear & Greed) to contextualize technical signals.

export interface SentimentData {
    value: number; // 0-100
    classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
    timestamp: number;
}

export const getFearAndGreedIndex = async (): Promise<SentimentData | null> => {
    try {
        const response = await fetch('https://api.alternative.me/fng/');
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const latest = data.data[0];
            return {
                value: parseInt(latest.value),
                classification: latest.value_classification,
                timestamp: parseInt(latest.timestamp)
            };
        }
        return null;
    } catch (e) {
        console.warn("Failed to fetch Fear & Greed index:", e);
        return null;
    }
};
