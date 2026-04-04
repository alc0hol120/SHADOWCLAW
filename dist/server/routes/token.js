import { Router } from 'express';
import { analyzeToken } from '../lib/token-analysis';
import { getTransactionHistory } from '../lib/helius';
import { clawAnalyze } from '../lib/claw-agent';
export const tokenRoute = Router();
tokenRoute.get('/:mint', async (req, res) => {
    try {
        const { mint } = req.params;
        if (!mint || mint.length < 32) {
            return res.status(400).json({ error: 'Invalid mint address' });
        }
        const report = await analyzeToken(mint);
        const clawReport = await clawAnalyze(JSON.stringify({
            type: 'TOKEN_SECURITY_ANALYSIS',
            ...report,
        }));
        res.json({
            token: report,
            clawAnalysis: clawReport,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
tokenRoute.get('/:mint/history', async (req, res) => {
    try {
        const { mint } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const history = await getTransactionHistory(mint, limit);
        res.json({ history });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
