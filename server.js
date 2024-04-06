const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
const playerNames = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7", "Player 8"];
const playerAnswers = ["Apple", "Brave", "Click", "Diver", "Eagle", "Flute", "Grape", "House"];
const playerScores = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];

const path = require('path');
const { debug } = require('console');
const { setInterval } = require('timers/promises');

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
    const currentDate = new Date();
    console.log("(" + currentDate + ") A client connected! There are now: " + clients.size + " connected.");
    //setRoundCountdown(5);
    startVoteUI();
    update();

    ws.on("message", function clientInput(message) {
        //Send this data 
        jsonData = JSON.parse(message);

        if(jsonData.type === "MENUUPDATE") {
            //Send the update to the other clients
            wss.clients.forEach((client) => {
                if(client.readyState == WebSocket.OPEN && client !== ws) {
                    client.send(JSON.stringify(jsonData));
                }
            })
        }
        else if(jsonData.type === "STARTGAME") {
            setRoundTime();
            console.log("Started Game!");
            wss.clients.forEach((client) => {
                if(client.readyState == WebSocket.OPEN) {
                    client.send(JSON.stringify(jsonData));
                }
            })
        }
    });

    ws.on('close', function() {
        const currentDate = new Date();
        clients.delete(ws);
        console.log("(" + currentDate + ") A client connected! There are now: " + clients.size + " connected.");
        update();
    })
})

var intervalID;
var time = 30;
function countdown() {
    wss.clients.forEach((client) => {
        const timeData = {
            type : "LOOP",
            roundTime: time 
        }
        client.send(JSON.stringify(timeData));
    })
    time = time - 1;
    if(time < 0) {
        clearInterval(intervalID);
    }
}

function setRoundTime() {
    if(!intervalID) {
        intervalID = setInterval(countdown, 1000);
    }
    
}



function update() {
    x = -1;
    wss.clients.forEach((client) => {
        var length = clients.size;
        var outputNames = [];
        var outputScores = [];
        for (var i = 0; i < length; i++) {
            outputNames.push(playerNames[i]);
            outputScores.push(playerScores[i]);
        }
        x = x + 1;
        if(client.readyState == WebSocket.OPEN) {
            const data = {
                type : "UPDATE",
                playerNames: outputNames,
                playerScores: outputScores,
                playerIndex: x
            }
            client.send(JSON.stringify(data));
        }
    })
}


function setRoundCountdown(duration) {
    wss.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN) {
            const data = {
                type : "LOOP",
                roundTime : duration
            }
            client.send(JSON.stringify(data));
        }
    })
}

function startVoteUI() {
    wss.clients.forEach((client) => {
        var length = clients.size;
        var outputNames = [];
        var outputAnswers = [];
        for (var i = 0; i < length; i++) {
            outputNames.push(playerNames[i]);
            outputAnswers.push(playerAnswers[i]);
        }
        if(client.readyState == WebSocket.OPEN) {
            const data = {
                type : "STARTVOTE",
                playerNames: outputNames,
                playerAnswers: outputAnswers
            }
            client.send(JSON.stringify(data));
        }
    })
}

server.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

app.use(express.static('public'));