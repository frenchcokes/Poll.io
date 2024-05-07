const { Player, Room } = require('./helper.js');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const path = require('path');

const PORT = process.env.PORT || 3000;

app.get('/', async(req, res) => {
    res.sendFile(path.join(__dirname, "../public/game.html"));
});

app.get('/tos', async(req, res) => {
    res.sendFile(path.join(__dirname, "../public/tos.html"));
});

app.get('/credits', async(req, res) => {
    res.sendFile(path.join(__dirname, "../public/credits.html"));
});

baseName = "polldotio.uw.r.appspot.com";
//baseName = "localhost:3000";

const rooms = {};
pack1Prompts = [];
pack2Prompts = [];
pack3Prompts = [];

function main() {
    addPrompts();
}

function addPrompts() {
    const fs = require('fs');
    const fileContent = fs.readFileSync('./server/prompts.txt', 'utf8');
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
        if(data.playerName.length > 8) { 
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Name must be less than 8 characters."});
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
        const room = rooms[roomID];
        socket.join(roomID);
        socket.player = new Player(data.playerName, 0);

        room.addPlayer(socket.player);

        const currentState = room.getState();
        switch(currentState) {
            case "MENU":
                socket.emit('sendToMenu', roomID);                
                socketMenuUpdate(socket, room);
                break;
            case "PROMPT":
                socket.emit('startPrompt', { prompt: room.getPrompt(), round: room.getCurrentRound(), maxRounds: room.getRounds()})
                break;
            case "VOTE":
                socket.emit('startPrompt', { prompt: room.getPrompt(), round: room.getCurrentRound(), maxRounds: room.getRounds()})
                socket.emit('startVotes', { playerNames: room.getPlayerNames(), playerAnswers: room.getPlayerAnswers(), excludeIndex: room.getPlayerAnswers().length - 1 });
                break;
            case "RESULT":
                socket.emit('voteResults', { playerNames: game.getPlayerNames(), playerAnswers: game.getPlayerAnswers(), playerVotes: game.getVoteResponseCounter(), scoreChanges: game.getScoreChanges() });
                break;
            case "FINALRESULTS":
                socket.emit('finalResults', { playerNames: game.getPlayerNames(), playerScores: game.getPlayerScores() });
                break;
        }
        io.to(roomID).emit("chatboxMessageReceived", { sender: "Server", message: socket.player.name + " has joined!" });
        updatePlayerButtons(roomID);
    });

    socket.on('disconnect', () => {
        if(socket.player === null) return;
        const room = rooms[socket.player.getRoomID()];
        room.removePlayer(socket.player);
        if(room.size() === 0) {
            delete rooms[room.getID()];
        }
        io.to(room.getID()).emit("chatboxMessageReceived", { sender: "Server", message: socket.player.name + " has left!"});
        updatePlayerButtons(room.getID());
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

        startPrompt(room);

        io.to(socket.player.getRoomID()).emit('chatboxMessageReceived', { sender: "Server", message: "Started Game!"});
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
        room.setState("MENU");
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
        if(playerName.length > 8) { 
            socket.emit('chatboxMessageReceived', { sender: "Server", message: "Name must be less than 8 characters."});
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

        socketMenuUpdate(socket, room);

        rooms[roomID].addPlayer(socket.player);

        socket.emit('sendToMenu', roomID);
        updatePlayerButtons(roomID);

        socket.emit("chatboxMessageReceived", { sender: "Server", message: "Room created! Room code: " + roomID })
    });

    socket.on('feedbackSubmission', (feedback) => {
        if(feedback.length > 100) { return; }
        console.log("FB: " + feedback);
    });
});

function startPrompt(game) {
    game.clearTimeInterval();
    startCountdown(game.getPromptTime(), "PROMPT", game);
    game.setState("PROMPT");

    game.resetResponses();

    game.nextRound();
    var selectedPrompt = generateRandomPrompt(game);
    game.setPrompt(selectedPrompt);
    io.to(game.getID()).emit('startPrompt', { prompt: selectedPrompt, round: game.getCurrentRound(), maxRounds: game.getRounds() });
}

function startVotes(game) {
    game.clearTimeInterval();
    startCountdown(game.getVoteTime(), "VOTE", game);
    game.setState("VOTE");

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

function startResults(game) {
    game.clearTimeInterval();
    startCountdown(game.getResultTime(), "RESULT", game);
    game.setState("RESULT");

    game.resetScoreChanges();

    const players = game.getPlayers();
    const votes = game.getVoteResponseCounter();
    for (var i = 0; i < players.length; i++) {
        if(votes[i] === undefined) { votes[i] = 0; }
        players[i].addScore(votes[i] * 1000);
        game.addScoreChangeToIndex(i, votes[i] * 1000);
    }
    updatePlayerButtons(game.getID());

    io.to(game.getID()).emit('voteResults', { playerNames: game.getPlayerNames(), playerAnswers: game.getPlayerAnswers(), playerVotes: game.getVoteResponseCounter(), scoreChanges: game.getScoreChanges() });
}

function resultsScreen(game) {
    game.setState("FINALRESULTS");
    io.to(game.getID()).emit('finalResults', { playerNames: game.getPlayerNames(), playerScores: game.getPlayerScores() });
}

function socketMenuUpdate(socket, room) {
    socket.emit('menuUpdate', {
        promptTime: room.promptTime,
        voteTime: room.voteTime,
        resultTime: room.resultTime,
        rounds: room.rounds,

        isPack1: room.isPack1,
        isPack2: room.isPack2,
        isPack3: room.isPack3
    });
}

function updatePlayerButtons(roomID) {
    if(io.sockets.adapter.rooms.get(roomID) === undefined) { return; }
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
    if(game.isPack1 === true) { possiblePrompts = possiblePrompts.concat(pack1Prompts); }
    if(game.isPack2 === true) { possiblePrompts = possiblePrompts.concat(pack2Prompts); }
    if(game.isPack3 === true) { possiblePrompts = possiblePrompts.concat(pack3Prompts); }

    if(possiblePrompts.length === game.usedPromptIndexes.length) {
        game.resetUsedPromptIndexes();
    }

    var randomIndex = Math.floor(Math.random() * possiblePrompts.length);
    while(game.isPromptIndexUsed(randomIndex) === true) {
        randomIndex = Math.floor(Math.random() * possiblePrompts.length);
    }
    game.addUsedPromptIndex(randomIndex);

    return possiblePrompts[randomIndex].replace("[ANYPLAYER]", game.getPlayerNames()[Math.floor(Math.random() * game.getPlayerNames().length)]);;
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
                    startPrompt(game);
                }
                else {
                    resultsScreen(game);
                }
                break;
        }
    }
    io.to(game.getID()).emit('loop', { time: game.getTime() });
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

app.use(express.static('public'));

main();