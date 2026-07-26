const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { verifyTransaction } = require('../services/blockchain');
const wsServer = require('../websocket');

router.get('/', (req, res) => {
    try {
        const wallet = req.query.wallet;
        const limit = parseInt(req.query.limit) || 20;

        let query = `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?`;
        let params = [limit];

        if (wallet) {
            query = `SELECT * FROM transactions WHERE from_wallet = ? OR to_wallet = ? ORDER BY timestamp DESC LIMIT ?`;
            params = [wallet, wallet, limit];
        }

        const stmt = db.prepare(query);
        const transactions = stmt.all(...params);

        res.json({ transactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/record', async (req, res) => {
    try {
        const { txHash } = req.body;
        if (!txHash) {
            return res.status(400).json({ error: 'txHash is required' });
        }

        const result = await verifyTransaction(txHash);
        
        if (!result.valid) {
            return res.status(400).json({ error: 'Invalid transaction', details: result.error });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO transactions (tx_hash, from_wallet, to_wallet, amount_usdc, fee_usdc, purpose, status, timestamp, block_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const feeUsdc = '0';
        
        stmt.run(txHash, result.from, result.to, result.amount, feeUsdc, result.purpose, 'completed', timestamp, 0);

        if (wsServer && wsServer.broadcast) {
            wsServer.broadcast({
                type: 'NEW_TRANSACTION',
                data: {
                    txHash, from: result.from, to: result.to, amountUsdc: result.amount, feeUsdc, purpose: result.purpose, timestamp, blockNumber: 0
                }
            });
        }

        res.json({ success: true, transaction: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
