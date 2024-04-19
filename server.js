const { Player, Room } = require('./helper.js');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const path = require('path');
const { setInterval } = require('timers');

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
})

const rooms = {};
io.on('connection', (socket) => {
    console.log("A user has connected!");

    socket.player = null;
    socket.on('joinRoom', (roomID) => {
        socket.join(roomID);
        socket.player = new Player("Player", 0);

        if(rooms[roomID] === undefined) { 
            rooms[roomID] = new Room(roomID);
        }
        rooms[roomID].addPlayer(socket.player);
        updatePlayerButtons(roomID);

        console.log("A client has joined room: " + roomID + ". There are now " + rooms[roomID].size() + " clients in the room.");
    });

    socket.on('disconnect', () => {
        if(socket.player === null) return;
        const room = rooms[socket.player.getRoomID()];
        room.removePlayer(socket.player);
        console.log('A client has disconnected from room: ' + room.getID() + ". There are now " + room.size() + " clients in the room.");
        if(room.size() === 0) {
            delete rooms[room.getID()];
        }
    });

    socket.on('chatboxSubmission', (message) => {
        socket.broadcast.to(socket.player.getRoomID()).emit('chatboxMessageReceived', { sender: socket.player.name, message: message });
    });

    socket.on('startGame', (data) => {
        const room = rooms[socket.player.getRoomID()];
        room.promptTime = data.promptTime;
        room.voteTime = data.voteTime;
        room.resultTime = data.resultTime;
        room.rounds = data.rounds;

        room.isPack1 = data.isPack1;
        room.isPack2 = data.isPack2;
        room.isPack3 = data.isPack3;

        startCountdown(room.promptTime, "PROMPT", game);
        console.log("Started game for room: " + roomID);

        var selectedPrompt = generateRandomPrompt(room);

        io.to(socket.player.getRoomID()).emit('startGame', { prompt: selectedPrompt, round: room.currentRound });
    });

    socket.on('promptSubmission', (prompt) => {
        console.log("Received prompt: " + prompt)
        socket.player.answer = prompt;
        const isAllResponses = rooms[socket.player.getRoomID()].responseAdded();

        if(isAllResponses === true) {
            startVotes(rooms[socket.player.getRoomID()]);
        }
    });

    socket.on('voteSubmission', (voteIndex) => {
        console.log("Received vote index: " + voteIndex);
        rooms[socket.player.getRoomID()].addVoteToCounterIndex(voteIndex);
        const isAllResponses = rooms[socket.player.getRoomID()].responseAdded();

        if(isAllResponses === true) {
            startResults(rooms[socket.player.getRoomID()]);
        }
    });

    socket.on('backToMenu', () => {
        io.to(socket.player.getRoomID()).emit('backToMenu');
    });
});

function updatePlayerButtons(roomID) {
    const socketsInRoom = io.sockets.adapter.rooms.get(roomID);
    var counter = 0;
    for (const socketID of socketsInRoom) {
        const socket = io.sockets.sockets.get(socketID);
        socket.emit('updatePlayerButtons', { playerNames: rooms[roomID].getPlayerNames(), playerScores: rooms[roomID].getPlayerScores(), playerIndex : counter});
        counter++;
    }
}

function generateRandomPrompt(game) {
    possiblePrompts = [];
    if(game.isPack1 === true) {
        possiblePrompts = possiblePrompts.concat(pack1Prompts);
    }
    if(game.isPack2 === true) {
        possiblePrompts = possiblePrompts.concat(pack1Prompts);
    }
    if(game.isPack3 === true) {
        possiblePrompts = possiblePrompts.concat(pack1Prompts);
    }

    var randomIndex = Math.floor(Math.random() * possiblePrompts.length);
    var value = possiblePrompts[randomIndex];

    return value;
}

function startResults(game) {
    game.clearInterval();
    startCountdown(resultTime, "RESULT", game);

    game.resetScoreChanges();

    const players = game.getPlayers();
    for (var i = 0; i < players.length; i++) {
        players[i].addScore(game.getVoteResponseCounter()[i] * 1000);
        game.addscoreChangesToIndex(i, game.getVoteResponseCounter()[i] * 1000);
    }
    updatePlayerButtons(game.getID());

    io.to(game.getID()).emit('voteResults', { playerNames: game.getPlayerNames(), playerAnswers: game.getPlayerAnswers(), playerVotes: game.getVoteResponseCounter(), scoreChanges: game.getScoreChanges() });
}

function startVotes(game) {
    game.clearInterval();
    startCountdown(voteTime, "VOTE", game);

    game.resetResponseVoteCounter();

    io.to(game.getID()).emit('startVotes', { playerNames: game.getPlayerNames(), playerAnswers: game.getPlayerAnswers() });
}

function countdown(type, game) {
    io.to(game.getID()).emit('loop', { time: game.getTime() });

    game.progressTime();
    if(game.getTime() < 0) {
        game.clearInterval();
        switch(type) {
            case "PROMPT":
                
                startVotes(game);
                console.log("Prompt countdown done!");
                break;
            case "VOTE":
                startResults(game);
                console.log("Vote countdown done!");
                break;
            case "RESULT":
                if(game.getCurrentRound() < game.getRounds()) {
                    nextRound(game);
                }
                else {
                    resultsScreen(game);
                }
                console.log("Result countdown done!");
                break;
        }
    }
}


function resultsScreen(game) {
    io.to(game.getID()).emit('finalResults', { playerNames: game.getPlayerNames(), playerScores: game.getPlayerScores() });
}


function startCountdown(length, type, game) {
    console.log("Started: " + type + " countdown.")
    game.clearInterval();
    game.setTime(length);
    var intervalID  = setInterval(() => {
        countdown(type, game);
    }, 1000);
    game.setInterval(intervalID);
    
}

function nextRound(game) {
    game.clearInterval();
    startCountdown(promptTime, "PROMPT");

    game.nextRound();
    var selectedPrompt = generateRandomPrompt(game);
    io.to(game.getID()).emit('startGame', { prompt: selectedPrompt, round: game.currentRound });
}


server.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

app.use(express.static('public'));
