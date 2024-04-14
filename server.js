const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
playerNames = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7", "Player 8"];
playerAnswers = [];
playerScores = [0, 0, 0, 0, 0, 0, 0, 0];

const path = require('path');
const { debug } = require('console');
const { stringify } = require('querystring');
const { setInterval } = require('timers');

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
})

numberOfResponses = 0;
numberOfVoteResponses = 0;
voteResponseCounter = [];

isPack1 = false;
pack1Prompts = [];
isPack2 = false;
pack2Prompts = [];
isPack3 = false;
pack3Prompts = [];

promptTime = -1;
voteTime = -1;
resultTime = -1;
rounds = -1;
roundCounter = 1;
wss.on('connection', (ws, req) => {
    clients.add(ws);

    const currentDate = new Date();
    console.log("(" + currentDate + ") A client connected! There are now: " + clients.size + " connected.");
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
                promptTime = jsonData.promptTime;
                voteTime = jsonData.voteTime;
                resultTime = jsonData.resultTime;
                rounds = jsonData.rounds;
                
                isPack1 = jsonData.isPack1;
                isPack2 = jsonData.isPack2;
                isPack3 = jsonData.isPack3;

                startCountdown(promptTime, "PROMPT");
                console.log("Started Game!");
                
                //Should generate random prompt from package
                var selectedPrompt = generateRandomPrompt();
                const data = {
                    type: "STARTGAME",
                    prompt: selectedPrompt,
                    round: roundCounter
                }
                stringifyData = JSON.stringify(data);
                wss.clients.forEach((client) => {
                    if(client.readyState == WebSocket.OPEN) {
                        client.send(stringifyData);
                    }
                })
                playerAnswers = new Array(clients.length);
                playerAnswers.fill("Quarter Pounder with Cheese");
                break;
            case "PROMPTSUBMISSION":
                console.log("Received prompt: " + jsonData.prompt)
                numberOfResponses = numberOfResponses + 1;

                let myArray = Array.from(clients);
                playerAnswers[myArray.indexOf(ws)] = jsonData.prompt;


                if(numberOfResponses === clients.size) {
                    console.log("Changed to vote page.");
                    numberOfResponses = 0;
                    startVotes();
                }
                break;
            case "VOTESUBMISSION":
                console.log("received vote index: " + jsonData.voteIndex);
                numberOfVoteResponses = numberOfVoteResponses + 1;
                voteResponseCounter[jsonData.voteIndex] = voteResponseCounter[jsonData.voteIndex] + 1;
                if(numberOfVoteResponses === clients.size) {
                    console.log("Changed to responses page.");
                    numberOfVoteResponses = 0;
                    startResults();
                }
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
            case "BACKTOMENU":
                wss.clients.forEach((client) => {
                    if(client.readyState == WebSocket.OPEN) {
                        const d = {
                            type: "BACKTOMENU"
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

function generateRandomPrompt() {
    possiblePrompts = [];
    if(isPack1 === true) {
        possiblePrompts = possiblePrompts.concat(pack1Prompts);
    }
    if(isPack2 === true) {
        possiblePrompts = possiblePrompts.concat(pack1Prompts);
    }
    if(isPack3 === true) {
        possiblePrompts = possiblePrompts.concat(pack1Prompts);
    }

    var randomIndex = Math.floor(Math.random() * possiblePrompts.length);
    var value = possiblePrompts[randomIndex];

    return value;
}

function startResults() {
    clearInterval(intervalID);
    startCountdown(resultTime, "RESULT");
    scoreChanges=[];
    for (var i = 0; i < voteResponseCounter.length; i++) {
        playerScores[i] = playerScores[i] + (voteResponseCounter[i] * 1000);
        scoreChanges.push(voteResponseCounter[i] * 1000);
    }
    update();



    wss.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN) {
            const d = {
                type: "VOTERESULTS",
                playerNames: playerNames,
                playerAnswers: playerAnswers,
                playerVotes: voteResponseCounter,
                scoreChanges: scoreChanges
            }
            client.send(JSON.stringify(d));
        }
    })
    
}

function startVotes() {
    clearInterval(intervalID);
    startCountdown(voteTime, "VOTE");
    //Refresh vote counter
    var length = clients.size;
    voteResponseCounter = Array.from({ length }, () => 0);

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
function countdown(type) {
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
        switch(type) {
            case "PROMPT":
                
                startVotes();
                console.log("Prompt countdown done!");
                break;
            case "VOTE":
                startResults();
                console.log("Vote countdown done!");
                break;
            case "RESULT":
                if(roundCounter < rounds) {
                    nextRound();
                }
                else {
                    resultsScreen();
                }
                console.log("Result countdown done!");
                break;
        }
    }
}

function resultsScreen() {
    var remainingClients = clients.size;
    var outputNames = playerNames.slice(0, remainingClients);
    var outputPlayerScores = playerScores.slice(0, remainingClients);
    const data = {
        type: "FINALRESULTS",
        playerNames: outputNames,
        playerScores: outputPlayerScores
    }
    stringifyData = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN) {
            client.send(stringifyData);
        }
    })
}

function startCountdown(length, type) {
    console.log("Started: " + type + " countdown.")
    clearInterval(intervalID);
    time = length;
    intervalID = setInterval(() => {
        countdown(type);
    }, 1000);
    
}

function nextRound() {
    clearInterval(intervalID);
    startCountdown(promptTime, "PROMPT");

    roundCounter = roundCounter + 1;
    var selectedPrompt = "Hello";
    const data = {
        type: "STARTGAME",
        prompt: selectedPrompt,
        round: roundCounter
    }
    stringifyData = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if(client.readyState == WebSocket.OPEN) {
            client.send(stringifyData);
        }
    })
    playerAnswers = new Array(clients.length);
    playerAnswers.fill("Quarter Pounder With Cheese");
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