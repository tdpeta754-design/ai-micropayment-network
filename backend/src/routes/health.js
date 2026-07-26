const express = require('express');
const router = express.Router();
const { addresses } = require('../services/blockchain');

router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        network: 'base-sepolia',
        timestamp: Date.now(),
        addresses
    });
});

module.exports = router;
