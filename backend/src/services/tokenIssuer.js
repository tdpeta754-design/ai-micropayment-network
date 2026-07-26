const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-dev';

function generatePoP({ txHash, payer, payee, amount, purpose, expiresInSeconds = 3600 }) {
    const tokenId = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    
    const payload = {
        sub: payer,
        aud: payee,
        amount,
        txHash,
        purpose,
        jti: tokenId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });

    const stmt = db.prepare(`
        INSERT INTO payment_proofs (token_id, tx_hash, payer_wallet, payee_wallet, amount, expires_at, used)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    
    stmt.run(tokenId, txHash, payer, payee, amount, expiresAt);

    return { token, tokenId, expiresAt };
}

function verifyPoP(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const stmt = db.prepare(`SELECT * FROM payment_proofs WHERE token_id = ?`);
        const proof = stmt.get(decoded.jti);

        if (!proof) {
            return { valid: false, error: 'Token not found in database' };
        }

        if (proof.used === 1) {
            return { valid: false, error: 'Token already used' };
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (proof.expires_at < currentTime) {
            return { valid: false, error: 'Token expired in database' };
        }

        return { valid: true, payload: decoded };
    } catch (err) {
        return { valid: false, error: err.message };
    }
}

module.exports = {
    generatePoP,
    verifyPoP
};
