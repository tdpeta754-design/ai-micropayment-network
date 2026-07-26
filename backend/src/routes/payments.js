const express = require('express');
const router = express.Router();
const { verifyTransaction } = require('../services/blockchain');
const { generatePoP, verifyPoP } = require('../services/tokenIssuer');
const db = require('../db/db');
const sentinel = require('../services/aiSentinel');

router.post('/verify', async (req, res) => {
    try {
        const { txHash, purpose } = req.body;
        const reqAmount = parseFloat(req.body.amount || '0.05');

        if (!txHash) {
            return res.status(400).json({ error: 'txHash is required' });
        }

        // Sentinel pre-inspection for abnormal amount / price spike
        const preCheck = await sentinel.inspectTransaction('UNKNOWN_PAYER', 'SYSTEM_PAYEE', reqAmount, 'pending', 'Verify attempt');
        if (!preCheck.allowed) {
            return res.status(403).json({ error: '🚨 AI Sentinel Circuit Breaker Engaged', details: preCheck });
        }

        const result = await verifyTransaction(txHash, purpose, req.body.amount || '0.05');

        if (!result.valid) {
            await sentinel.inspectTransaction('UNKNOWN_PAYER', 'SYSTEM_PAYEE', reqAmount, 'failed', result.error || 'Verification failed');
            return res.status(400).json({ error: 'Transaction verification failed', details: result.error });
        }

        if (purpose && result.purpose && result.purpose !== purpose) {
            await sentinel.inspectTransaction(result.from || 'UNKNOWN_PAYER', result.to || 'SYSTEM_PAYEE', reqAmount, 'failed', 'Purpose mismatch');
            return res.status(400).json({ error: 'Purpose mismatch' });
        }

        await sentinel.inspectTransaction(result.from, result.to, parseFloat(result.amount || reqAmount), 'completed', 'Success');

        const pop = generatePoP({
            txHash,
            payer: result.from,
            payee: result.to,
            amount: result.amount,
            purpose: result.purpose || purpose
        });

        const timestamp = Math.floor(Date.now() / 1000);
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO transactions (tx_hash, from_wallet, to_wallet, amount_usdc, fee_usdc, purpose, status, timestamp, block_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(txHash, result.from, result.to, result.amount, '0', result.purpose || purpose, 'completed', timestamp, 0);

        res.json({
            success: true,
            popToken: pop.token,
            details: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/validate-token', (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'token is required' });
        }

        const result = verifyPoP(token);
        
        if (!result.valid) {
            return res.status(401).json({ valid: false, error: result.error });
        }

        res.json({ valid: true, payload: result.payload });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
