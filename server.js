const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
playerNames = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7", "Player 8"];
playerAnswers = [];
const playerScores = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];

const path = require('path');
const { debug } = require('console');
const { setInterval } = require('timers/promises');
const { stringify } = require('querystring');

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
})

/*
app.get('/game', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
})
*/

numberOfResponses = 0;

wss.on('connection', (ws, req) => {
    clients.add(ws);
    const currentDate = new Date();
    console.log("(" + currentDate + ") A client connected! There are now: " + clients.size + " connected.");
    //setRoundCountdown(5);
    startVoteUI();
    update();

    wss.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN) {
            const d = {
                type: "CHATBOXMESSAGERECEIVED",
                sender: "System",
                message: "A player has joined!"
            }
            client.send(JSON.stringify(d));
        }
    })

    ws.on("message", function clientInput(message) {
        //Send this data 
        jsonData = JSON.parse(message);
        switch(jsonData.type) {
            case "MENUUPDATE":
                wss.clients.forEach((client) => {
                    if(client.readyState == WebSocket.OPEN && client !== ws) {
                        client.send(JSON.stringify(jsonData));
                    }
                })
                break;
            case "STARTGAME":
                setRoundTime();
                console.log("Started Game!");
                
                var selectedPrompt = "Hello";
                const data = {
                    type: "STARTGAME",
                    prompt: selectedPrompt
                }
                stringifyData = JSON.stringify(data);
                wss.clients.forEach((client) => {
                    if(client.readyState == WebSocket.OPEN) {
                        client.send(stringifyData);
                    }
                })
                playerAnswers = [];
                break;
            case "PROMPTSUBMISSION":
                console.log("Received prompt: " + jsonData.prompt)
                numberOfResponses = numberOfResponses + 1;
                playerAnswers.push(jsonData.prompt);
                if(numberOfResponses === clients.size) {
                    console.log("Changed to vote page.");
                    startVotes();
                }
                break;
            case "VOTESUBMISSION":
                console.log("received vote button: " + jsonData.voteIndex);
                break;
            case "CHATBOXSUBMISSION":
                wss.clients.forEach((client) => {
                    if(client.readyState == WebSocket.OPEN && client !== ws) {
                        const d = {
                            type: "CHATBOXMESSAGERECEIVED",
                            sender: playerNames[0],
                            message: jsonData.message
                        }
                        client.send(JSON.stringify(d));
                    }
                })
                break;
        }
    });

    ws.on('close', function() {
        const currentDate = new Date();
        clients.delete(ws);
        console.log("(" + currentDate + ") A client connected! There are now: " + clients.size + " connected.");
        update();
    })
})

function startVotes() {
    var outputNames = [];
    var length = clients.size;
    for (var i = 0; i < length; i++) {
        outputNames.push(playerNames[0]);
    }

    wss.clients.forEach((client) => {
        const d = {
            type: "STARTVOTE",
            playerNames: outputNames,
            playerAnswers: playerAnswers 
        }
        client.send(JSON.stringify(d));
    })
}

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