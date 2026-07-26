const express = require('express');
const router = express.Router();
const sentinel = require('../services/aiSentinel');

/**
 * AI Sentinel Security Warden Routes
 * /api/sentinel/...
 */

// GET /api/sentinel/status
router.get('/status', (req, res) => {
    try {
        const status = sentinel.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/sentinel/simulate-attack
router.post('/simulate-attack', async (req, res) => {
    try {
        const { attackType } = req.body; // 'RAPID_LOOP_HALLUCINATION' | 'PRICE_SPIKE_ANOMALY'
        const result = await sentinel.simulateAttack(attackType || 'RAPID_LOOP_HALLUCINATION');
        
        res.json({
            success: true,
            message: 'Attack simulation executed.',
            result
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/sentinel/reset
router.post('/reset', (req, res) => {
    try {
        const { wallet } = req.body;
        if (wallet) {
            sentinel.circuitBreakersTripped.delete(wallet);
            sentinel.activeThreats.delete(wallet);
        } else {
            sentinel.circuitBreakersTripped.clear();
            sentinel.activeThreats.clear();
        }
        res.json({ success: true, message: 'Sentinel circuit breakers reset.' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
