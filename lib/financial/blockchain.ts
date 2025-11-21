
// Sovereign Blockchain Watcher
// Uses public APIs to check balances without private keys.

interface WalletInfo {
    address: string;
    chain: string;
    balance: number;
    unconfirmed?: number;
}

export const getPublicWalletBalance = async (chain: string, address: string): Promise<WalletInfo | string> => {
    try {
        // BITCOIN (BlockCypher Free Tier)
        if (chain === 'BTC') {
            const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Address not found or API limit");
            const data = await res.json();
            return {
                address,
                chain: 'BTC',
                balance: data.balance / 100000000, // Satoshis to BTC
                unconfirmed: data.unconfirmed_balance / 100000000
            };
        }

        // ETHEREUM (BlockCypher Free Tier)
        if (chain === 'ETH') {
            const url = `https://api.blockcypher.com/v1/eth/main/addrs/${address}/balance`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Address not found or API limit");
            const data = await res.json();
            return {
                address,
                chain: 'ETH',
                balance: data.balance / 1000000000000000000 // Wei to ETH
            };
        }

        // SOLANA (Public RPC)
        if (chain === 'SOL') {
            const url = "https://api.mainnet-beta.solana.com";
            const body = {
                "jsonrpc": "2.0", "id": 1,
                "method": "getBalance",
                "params": [address]
            };
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            return {
                address,
                chain: 'SOL',
                balance: data.result.value / 1000000000 // Lamports to SOL
            };
        }

        return "Unsupported chain. Use BTC, ETH, or SOL.";

    } catch (e: any) {
        return `Blockchain Query Failed: ${e.message}`;
    }
};
