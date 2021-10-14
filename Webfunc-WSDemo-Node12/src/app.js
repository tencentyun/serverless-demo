const WebSocket = require('ws');

const WebSocketServer = WebSocket.Server;

const wss = new WebSocketServer({
    host: "0.0.0.0",
    port: 9000
});

wss.on('connection', function (ws) {
    console.log(`[SERVER] connection()`);
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        ws.send(`ECHO: ${message}`, (err) => {
            if (err) {
                console.log(`[SERVER] error: ${err}`);
            }
        });
    })
});