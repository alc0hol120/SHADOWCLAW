import { Router } from 'express';
import { getBalance, getTokenAccounts, getTransactionHistory } from '../lib/helius';
import { clawAnalyze } from '../lib/claw-agent';
export const riskRoute = Router();
riskRoute.get('/wallet/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const results = await Promise.allSettled([
            getBalance(address),
            getTokenAccounts(address),
            getTransactionHistory(address, 5),
        ]);
        const balance = results[0].status === 'fulfilled' ? results[0].value : 0;
        const tokenAccounts = results[1].status === 'fulfilled' ? results[1].value : { value: [] };
        const recentTxs = results[2].status === 'fulfilled' ? results[2].value : [];
        const txSummary = recentTxs?.map((tx) => ({
            type: tx.type,
            source: tx.source,
            fee: tx.fee,
            description: tx.description?.slice(0, 200),
            timestamp: tx.timestamp,
        })) || [];
        const clawReport = await clawAnalyze(JSON.stringify({
            type: 'WALLET_RISK_ANALYSIS',
            address,
            balanceSOL: balance / 1e9,
            tokenAccountCount: tokenAccounts?.value?.length || 0,
            recentTransactionSummary: txSummary,
        }));
        res.json({
            address,
            balanceSOL: balance / 1e9,
            tokenAccounts,
            recentTransactions: recentTxs,
            clawAnalysis: clawReport,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Wallet analysis failed' });
    }
});
riskRoute.post('/analyze', async (req, res) => {
    try {
        const { data, context } = req.body;
        if (!data) {
            return res.status(400).json({ error: 'Missing data for analysis' });
        }
        const clawReport = await clawAnalyze(JSON.stringify({
            type: context || 'CUSTOM_ANALYSIS',
            data,
        }));
        res.json({ clawAnalysis: clawReport });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
