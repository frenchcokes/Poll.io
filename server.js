const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
const playerNames = new Set(["Player 1", "Player 2", "Player 3", "Player 4"]);

const path = require('path');

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
})

/*
app.get('/game', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
})
*/

wss.on('connection', (ws, req) => {
    clients.add(ws);
    console.log("A client connected! There are now: " + clients.size + " connected.");

    update();

    ws.on('close', function() {
        clients.delete(ws);
        console.log("A client connected! There are now: " + clients.size + " connected.");
        update();
    })
})

function update() {
    x = -1;
    wss.clients.forEach((client) => {
        x = x + 1;
        if(client.readyState == WebSocket.OPEN) {
            const data = {
                type : "UPDATE",
                numberOfPlayers : clients.size,
                playerIndex: x
            }
            client.send(JSON.stringify(data));
        }
    })
}

/*
setInterval(loop, 5000);
function loop() {
    update();
}
*/

server.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

app.use(express.static('public'));