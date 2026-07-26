const { WebSocketServer } = require('ws');

let wss;

function initWebSocket(server) {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket');
        
        ws.on('close', () => {
            console.log('Client disconnected from WebSocket');
        });
    });

    return wss;
}

function broadcast(data) {
    if (!wss) return;
    
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}

module.exports = {
    initWebSocket,
    broadcast
};
