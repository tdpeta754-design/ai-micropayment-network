const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { predictWalletAddress, getEthBalance, getUsdcBalance } = require('../services/blockchain');
const crypto = require('crypto');

router.post('/predict', async (req, res) => {
    try {
        const { owner, salt } = req.body;
        if (!owner) {
            return res.status(400).json({ error: 'owner is required' });
        }

        const walletSalt = salt || Math.floor(Math.random() * 1000000000);
        const address = await predictWalletAddress(owner, walletSalt);

        const stmt = db.prepare(`SELECT address FROM wallets WHERE address = ?`);
        const existing = stmt.get(address);

        if (!existing) {
            const insert = db.prepare(`
                INSERT INTO wallets (address, owner, salt, spending_policy)
                VALUES (?, ?, ?, ?)
            `);
            insert.run(address, owner, walletSalt, JSON.stringify({}));
        }

        res.json({ address, owner, salt: walletSalt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:address', async (req, res) => {
    try {
        const address = req.params.address;
        const stmt = db.prepare(`SELECT * FROM wallets WHERE address = ?`);
        const wallet = stmt.get(address);

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const ethBalance = await getEthBalance(address);
        const usdcBalance = await getUsdcBalance(address);

        res.json({
            ...wallet,
            balances: {
                eth: ethBalance,
                usdc: usdcBalance
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:address/session-keys', (req, res) => {
    try {
        const wallet_address = req.params.address;
        const { key_address, valid_after, valid_until, spend_limit } = req.body;

        if (!key_address || !valid_after || !valid_until || !spend_limit) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = crypto.randomUUID();
        const stmt = db.prepare(`
            INSERT INTO session_keys (id, wallet_address, key_address, valid_after, valid_until, spend_limit)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(id, wallet_address, key_address, valid_after, valid_until, spend_limit);

        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:address/session-keys', (req, res) => {
    try {
        const wallet_address = req.params.address;
        const stmt = db.prepare(`SELECT * FROM session_keys WHERE wallet_address = ? AND active = 1`);
        const keys = stmt.all(wallet_address);

        res.json({ sessionKeys: keys });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
