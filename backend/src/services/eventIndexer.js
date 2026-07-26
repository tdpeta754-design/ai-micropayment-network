const { ethers } = require('ethers');
const db = require('../db/db');
const { paymentRouterContract, provider } = require('./blockchain');
const wsServer = require('../websocket');

let isIndexing = false;

async function startEventIndexer() {
    if (isIndexing) return;
    isIndexing = true;
    console.log('Starting event indexer...');

    try {
        paymentRouterContract.on('PaymentProcessed', (from, to, amount, nonce, purpose, fee, event) => {
            handlePaymentProcessed(from, to, amount, nonce, purpose, fee, event);
        });

        paymentRouterContract.on('EscrowCreated', (escrowId, payer, payee, amount, deadline, event) => {
            console.log(`Escrow created: ${escrowId}`);
        });

        provider.on('error', (tx) => {
            if (tx && (tx.message?.includes('filter not found') || JSON.stringify(tx).includes('filter not found'))) return;
            console.error('Provider error:', tx);
            restartIndexer();
        });

    } catch (e) {
        console.error('Error starting event indexer:', e);
        restartIndexer();
    }
}

function handlePaymentProcessed(from, to, amount, nonce, purpose, fee, event) {
    try {
        const txHash = event.log.transactionHash;
        const blockNumber = event.log.blockNumber;
        const amountUsdc = ethers.formatUnits(amount, 6);
        const feeUsdc = ethers.formatUnits(fee, 6);
        const timestamp = Math.floor(Date.now() / 1000);

        const stmt = db.prepare(`
            INSERT OR IGNORE INTO transactions (tx_hash, from_wallet, to_wallet, amount_usdc, fee_usdc, purpose, status, timestamp, block_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(txHash, from, to, amountUsdc, feeUsdc, purpose, 'completed', timestamp, blockNumber);
        
        console.log(`Indexed payment: ${txHash}`);

        if (wsServer && wsServer.broadcast) {
            wsServer.broadcast({
                type: 'NEW_TRANSACTION',
                data: {
                    txHash, from, to, amountUsdc, feeUsdc, purpose, timestamp, blockNumber
                }
            });
        }
    } catch (e) {
        console.error('Error handling PaymentProcessed event:', e);
    }
}

function restartIndexer() {
    isIndexing = false;
    setTimeout(() => {
        console.log('Restarting event indexer...');
        startEventIndexer();
    }, 5000);
}

module.exports = {
    startEventIndexer
};
