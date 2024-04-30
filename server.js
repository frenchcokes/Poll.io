const { Player, Room } = require('./helper.js');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const path = require('path');
const { setInterval } = require('timers');
const { type } = require('os');

const PORT = process.env.PORT || 3000;

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/game.html"));
});

app.get('/tos', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/tos.html"));
});

app.get('/credits', async(req, res) => {
    res.sendFile(path.join(__dirname, "/public/credits.html"));
});

baseName = "polliowebgameproject.uw.r.appspot.com";
const rooms = {};
pack1Prompts = [];
pack2Prompts = [];
pack3Prompts = [];

addPrompts();
function addPrompts() {
    const fs = require('fs');
    const fileContent = fs.readFileSync('prompts.txt', 'utf8');
    const lines = fileContent.trim().split('\n');
    const arrays = lines.map((line) => JSON.parse(line));

    pack1Prompts = arrays[0];
    pack2Prompts = arrays[1];
    pack3Prompts = arrays[2];
}

io.on('connection', (socket) => {
    socket.emit('addLinks', baseName);
    socket.player = null;
    socket.on('joinRoom', (data) => {
        if(rooms[data.roomID] === undefined) { 
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Room does not exist."})
            return; 
        }
        if(data.playerName.length > 15) { 
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Name must be less than 15 characters."});
            return; 
        }
        if(rooms[data.roomID].size() >= 8) {
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Room is full."})
            return;
        }
        if(rooms[data.roomID].getPlayerNames().includes(data.playerName) === true){
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Name already taken."})
            return;
        }

        const roomID = data.roomID;
        socket.join(roomID);
        socket.player = new Player(data.playerName, 0);

        rooms[roomID].addPlayer(socket.player);

        socket.emit('sendToMenu', roomID);
        updatePlayerButtons(roomID);

        io.to(roomID).emit("chatboxMessageReceived", { sender: "Server", message: socket.player.name + " has joined!" });
        console.log("A client has joined room: " + roomID + ". There are now " + rooms[roomID].size() + " clients in the room.");
        
        const room = rooms[roomID];
        socket.emit('menuUpdate', {
            promptTime: room.promptTime,
            voteTime: room.voteTime,
            resultTime: room.resultTime,
            rounds: room.rounds,

            isPack1: room.isPack1,
            isPack2: room.isPack2,
            isPack3: room.isPack3
        });
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
        if(socket.player === null) return;
        socket.broadcast.to(socket.player.getRoomID()).emit('chatboxMessageReceived', { sender: socket.player.name, message: message });
    });

    socket.on('startGame', (data) => {
        if(socket.player === null) return;
        const room = rooms[socket.player.getRoomID()];
        if(room.size() < 3) {
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Need at least 3 players to start."});
            return;
        }
        if(data.isPack1 === false && data.isPack2 === false && data.isPack3 === false) {
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Please select at least one pack."});
            return;
        }
        room.promptTime = data.promptTime;
        room.voteTime = data.voteTime;
        room.resultTime = data.resultTime;
        room.rounds = data.rounds;

        room.isPack1 = data.isPack1;
        room.isPack2 = data.isPack2;
        room.isPack3 = data.isPack3;

        startCountdown(room.getPromptTime(), "PROMPT", room);

        var selectedPrompt = generateRandomPrompt(room);

        io.to(socket.player.getRoomID()).emit('chatboxMessageReceived', { sender: "Server", message: "Started Game!"});
        io.to(socket.player.getRoomID()).emit('startGame', { prompt: selectedPrompt, round: room.getCurrentRound(), maxRounds: room.getRounds()});
    });

    socket.on('promptSubmission', (prompt) => {
        if(socket.player === null) { return; }
        if(prompt.length > 20) { 
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Prompt must be less than 20 characters."});
            return; 
        }
        if((rooms[socket.player.getRoomID()].getPlayerAnswers().includes(prompt)) === true) {
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "That answer was already submitted."});
            return;
        }

        socket.emit('successfulPromptSubmission');
        socket.player.answer = prompt;
        const isAllResponses = rooms[socket.player.getRoomID()].responseAdded();

        if(isAllResponses === true) {
            startVotes(rooms[socket.player.getRoomID()]);
        }
    });

    socket.on('voteSubmission', (voteIndex) => {
        if(socket.player === null) return;
        rooms[socket.player.getRoomID()].addVoteToCounterIndex(voteIndex);
        const isAllResponses = rooms[socket.player.getRoomID()].responseAdded();

        if(isAllResponses === true) {
            startResults(rooms[socket.player.getRoomID()]);
        }
    });

    socket.on('backToMenu', () => {
        if(socket.player === null) return;
        const room = rooms[socket.player.getRoomID()];
        room.resetPlayerScores();
        room.resetPlayerAnswers();
        room.resetUsedPromptIndexes();
        room.resetRoundCounter();
        room.resetResponses();

        updatePlayerButtons(socket.player.getRoomID());
        io.to(socket.player.getRoomID()).emit('backToMenu');
    });

    socket.on('menuUpdate', (data) => {
        if(socket.player === null) return;

        const room = rooms[socket.player.getRoomID()];
        room.promptTime = data.promptTime;
        room.voteTime = data.voteTime;
        room.resultTime = data.resultTime;
        room.rounds = data.rounds;

        room.isPack1 = data.isPack1;
        room.isPack2 = data.isPack2;
        room.isPack3 = data.isPack3;

        io.to(socket.player.getRoomID()).emit('menuUpdate', data);
    });

    socket.on("createRoom", (playerName) => {
        if(playerName.length > 15) { 
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Name must be less than 15 characters."});
            return; 
        }
        if(Object.keys(rooms).length >= 50) { 
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Server at capacity! Try again later."}); 
            return; 
        }
        const characters = '0123456789ABCDEF';
        const roomCodeLength = 6;

        function generateRoomCode() {
            let roomCode = '';
            for (let i = 0; i < roomCodeLength; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                roomCode += characters[randomIndex];
            }
            return roomCode;
        }
        
        const roomCode = generateRoomCode();
        while(roomCode in rooms) {
            roomCode = generateRoomCode();
            if((roomCode in rooms) === false) { break; }
        }

        const roomID = roomCode;
        socket.join(roomID);
        socket.player = new Player(playerName, 0);

        rooms[roomID] = new Room(roomID);
        
        const room = rooms[roomID];
        room.promptTime = 15;
        room.voteTime = 10;
        room.resultTime = 3;
        room.rounds = 3;

        room.isPack1 = true;
        room.isPack2 = false;
        room.isPack3 = false;
        socket.emit('menuUpdate', {
            promptTime: room.promptTime,
            voteTime: room.voteTime,
            resultTime: room.resultTime,
            rounds: room.rounds,

            isPack1: room.isPack1,
            isPack2: room.isPack2,
            isPack3: room.isPack3
        });

        rooms[roomID].addPlayer(socket.player);

        socket.emit('sendToMenu', roomID);
        updatePlayerButtons(roomID);

        socket.emit("chatboxMessageReceived", { sender: "Server", message: "Room created! Room code: " + roomID })
        console.log("A client has created and joined room: " + roomID + ". There are now " + rooms[roomID].size() + " clients in the room.");
    });

    socket.on('feedbackSubmission', (feedback) => {
        if(feedback.length > 100) { return; }
        console.log("Someone gave the feedback: " + feedback);
    });
});

function updatePlayerButtons(roomID) {
    const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomID));
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
        possiblePrompts = possiblePrompts.concat(pack2Prompts);
    }
    if(game.isPack3 === true) {
        possiblePrompts = possiblePrompts.concat(pack3Prompts);
    }

    if(possiblePrompts.length === game.usedPromptIndexes.length) {
        game.resetUsedPromptIndexes();
    }

    var randomIndex = Math.floor(Math.random() * possiblePrompts.length);
    while(game.isPromptIndexUsed(randomIndex) === true) {
        randomIndex = Math.floor(Math.random() * possiblePrompts.length);
    }
    game.addUsedPromptIndex(randomIndex);

    var modifiedPrompt = possiblePrompts[randomIndex].replace("[ANYPLAYER]", game.getPlayerNames()[Math.floor(Math.random() * game.getPlayerNames().length)]);

    return modifiedPrompt;
}

function startResults(game) {
    game.clearTimeInterval();
    startCountdown(game.getResultTime(), "RESULT", game);

    game.resetScoreChanges();

    const players = game.getPlayers();
    for (var i = 0; i < players.length; i++) {
        players[i].addScore(game.getVoteResponseCounter()[i] * 1000);
        game.addScoreChangeToIndex(i, game.getVoteResponseCounter()[i] * 1000);
    }
    updatePlayerButtons(game.getID());

    io.to(game.getID()).emit('voteResults', { playerNames: game.getPlayerNames(), playerAnswers: game.getPlayerAnswers(), playerVotes: game.getVoteResponseCounter(), scoreChanges: game.getScoreChanges() });
}

function startVotes(game) {
    game.clearTimeInterval();
    startCountdown(game.getVoteTime(), "VOTE", game);

    game.resetResponses();
    game.resetResponseVoteCounter();

    const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(game.getID()));
    var counter = 0;
    socketsInRoom.forEach((socketID) => {
        const socket = io.sockets.sockets.get(socketID);
        socket.emit('startVotes', { playerNames: game.getPlayerNames(), playerAnswers: game.getPlayerAnswers(), excludeIndex: counter });
        counter = counter + 1;
    });
}

function countdown(type, game) {

    game.progressTime();
    if(game.getTime() <= 0) {
        game.clearTimeInterval();
        switch(type) {
            case "PROMPT":
                startVotes(game);
                break;
            case "VOTE":
                startResults(game);
                break;
            case "RESULT":
                if(game.getCurrentRound() < (game.getRounds() - 1)) {
                    nextRound(game);
                }
                else {
                    resultsScreen(game);
                }
                break;
        }
    }
    io.to(game.getID()).emit('loop', { time: game.getTime() });
}


function resultsScreen(game) {
    io.to(game.getID()).emit('finalResults', { playerNames: game.getPlayerNames(), playerScores: game.getPlayerScores() });
}


function startCountdown(length, type, game) {
    game.clearTimeInterval();
    game.setTime(length);
    io.to(game.getID()).emit('loop', { time: game.getTime() });
    var intervalID  = setInterval(() => {
        countdown(type, game);
    }, 1000);
    game.setIntervalID(intervalID);
    
}

function nextRound(game) {
    game.clearTimeInterval();
    startCountdown(game.getPromptTime(), "PROMPT", game);

    game.nextRound();
    var selectedPrompt = generateRandomPrompt(game);
    io.to(game.getID()).emit('startGame', { prompt: selectedPrompt, round: game.getCurrentRound(), maxRounds: game.getRounds() });
}


server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

app.use(express.static('public'));
