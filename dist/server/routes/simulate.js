import { Router } from 'express';
import { simulateTransaction, getBalance, getParsedTransaction } from '../lib/helius';
import { clawAnalyze } from '../lib/claw-agent';
export const simulateRoute = Router();
simulateRoute.post('/transaction', async (req, res) => {
    try {
        const { transaction, walletAddress } = req.body;
        if (!transaction) {
            return res.status(400).json({ error: 'Missing transaction (base64 encoded)' });
        }
        let preBalance = null;
        if (walletAddress) {
            preBalance = await getBalance(walletAddress);
        }
        const simResult = await simulateTransaction(transaction);
        let estimatedCost = null;
        if (preBalance !== null && simResult.unitsConsumed > 0) {
            estimatedCost = simResult.unitsConsumed * 0.000005;
        }
        const clawReport = await clawAnalyze(JSON.stringify({
            type: 'TRANSACTION_SIMULATION',
            success: simResult.success,
            logs: simResult.logs,
            unitsConsumed: simResult.unitsConsumed,
            error: simResult.error,
            walletAddress,
            preBalance: preBalance ? preBalance / 1e9 : null,
            estimatedCostSOL: estimatedCost,
        }));
        res.json({
            simulation: simResult,
            preBalance: preBalance ? preBalance / 1e9 : null,
            estimatedCostSOL: estimatedCost,
            clawAnalysis: clawReport,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
simulateRoute.post('/preview', async (req, res) => {
    try {
        const { signature } = req.body;
        if (!signature) {
            return res.status(400).json({ error: 'Missing transaction signature' });
        }
        const txData = await getParsedTransaction(signature);
        const clawReport = await clawAnalyze(JSON.stringify({
            type: 'TRANSACTION_REVIEW',
            transaction: txData,
        }));
        res.json({
            transaction: txData,
            clawAnalysis: clawReport,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
