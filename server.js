const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
const path = require('path');

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
})

wss.on('connection', function connect(ws) {
    clients.add(ws);

    ws.on('close', function() {
        clients.delete(ws);
    })
})

server.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

app.use(express.static('public'));