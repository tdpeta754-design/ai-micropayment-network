const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

process.on('uncaughtException', (err) => {
    if (err.message && err.message.includes('filter not found')) return;
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    if (reason && JSON.stringify(reason).includes('filter not found')) return;
    console.error('Unhandled Rejection:', reason);
});

const { initWebSocket } = require('./websocket');
const { startEventIndexer } = require('./services/eventIndexer');

const healthRoutes = require('./routes/health');
const walletsRoutes = require('./routes/wallets');
const transactionsRoutes = require('./routes/transactions');
const paymentsRoutes = require('./routes/payments');
const sentinelRoutes = require('./routes/sentinel');
const sentinel = require('./services/aiSentinel');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/sentinel', sentinelRoutes);

initWebSocket(server);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        startEventIndexer();
        sentinel.startMonitoring();
    });
}

module.exports = { app, server };
