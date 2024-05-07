class Room {
    constructor(ID) {
        this.ID = ID;
        this.players = [];
        this.currentRound = -1;
        this.responseCounter = [];
        this.scoreChanges = [];
        this.usedPromptIndexes = [];
        this.currentResponses = 0;
        this.responsesNeeded = 0;

        this.state= "MENU"; //MENU, PROMPT, VOTE, RESULT, FINALRESULTS

        this.prompt = "NULL";
        //Settings
        this.promptTime = 15;
        this.voteTime = 10;
        this.resultTime = 3;
        this.rounds = 3;

        this.isPack1 = true;
        this.isPack2 = false;
        this.isPack3 = true;

        this.intervalID = null;
        this.time = 0;

        this.resetResponseVoteCounter();
    }

    setPrompt(prompt) { this.prompt = prompt; }
    getPrompt() { return this.prompt; } 

    setState(state) { 
        this.state = state; 
    }
    getState() { return this.state; }

    addPlayer(player) {
        player.setRoomID(this.ID);
        this.players.push(player);
    }

    setIntervalID(interval) { this.intervalID = interval; }
    clearTimeInterval() { clearInterval(this.intervalID); }
    setTime(amount) { this.time = amount;}
    getTime() { return this.time; }
    progressTime() {
        this.time--;
    }

    nextRound() {
        this.currentRound++;
        this.resetResponseVoteCounter();
        this.resetScoreChanges();
        this.resetPlayerAnswers();
    }

    resetPlayerAnswers() { 
        const answers = ["Pizza", "Burger", "Taco", "Sushi", "Spaghetti", "Fried Chicken", "Tomato", "Bacon"];
        const usedIndexes = [];
        this.players.forEach(p => {
            let randomIndex;
            do {
            randomIndex = Math.floor(Math.random() * answers.length);
            } while (usedIndexes.includes(randomIndex));
            usedIndexes.push(randomIndex);
            p.setAnswer(answers[randomIndex]);
        });
    }

    resetPlayerScores() { this.players.forEach(p => p.setScore(0));}

    resetRoundCounter() { this.currentRound = -1; }

    resetUsedPromptIndexes() { this.usedPromptIndexes = []; }

    getVoteResponseCounter() { return this.responseCounter; }
    
    resetResponseVoteCounter() {
        const length = this.players.length;
        this.responseCounter = Array.from({ length }, () => 0);
    }

    getScoreChanges() { return this.scoreChanges; }

    resetScoreChanges() {
        const length = this.players.length;
        this.scoreChanges = Array.from({ length }, () => 0);
    }

    resetResponses() {
        this.currentResponses = 0;
    }

    addScoreChangeToIndex(index, amount) {
        this.scoreChanges[index] = this.scoreChanges[index] + amount;
    }

    addVoteToCounterIndex(index) { this.responseCounter[index]++; }

    addUsedPromptIndex(index) { this.usedPromptIndexes.push(index); }
    isPromptIndexUsed(index) { return this.usedPromptIndexes.includes(index); }
    resetUsedPromptIndexes() { this.usedPromptIndexes = []; }
    usedPromptIndexes() { return this.usedPromptIndexes; }

    responseAdded() { 
        this.currentResponses++; 
        if(this.currentResponses == this.players.length) {
            this.currentResponses = 0;
            return true;
        }
        else {
            return false;
        }
    }

    getCurrentRound() { return this.currentRound; }

    getPlayers() { return this.players; }

    getPlayerNames() { return this.players.map(p => p.getName()); }

    getPlayerScores() { return this.players.map(p => p.getScore()); }

    getPlayerAnswers() { return this.players.map(p => p.getAnswer()); }

    removePlayer(player) { this.players = this.players.filter(p => p !== player); }

    size() { return this.players.length; }    

    getID() { return this.ID; }

    setPromptTime(time) { this.promptTime = time; }
    setVoteTime(time) { this.voteTime = time; }
    setResultTime(time) { this.resultTime = time; }
    setRounds(rounds) { this.rounds = rounds; }

    setIsPack1(isPack1) { this.isPack1 = isPack1; }
    setIsPack2(isPack2) { this.isPack2 = isPack2; }
    setIsPack3(isPack3) { this.isPack3 = isPack3; }

    getPromptTime() { return this.promptTime; }
    getVoteTime() { return this.voteTime; }
    getResultTime() { return this.resultTime; }
    getRounds() { return this.rounds; }

    getIsPack1() { return this.isPack1; }
    getIsPack2() { return this.isPack2; }
    getIsPack3() { return this.isPack3; }
}

class Player {
    constructor(name, score) {
        this.name = name;
        this.score = score;
        this.RoomID = null;
        this.answer = "";
    }

    setRoomID(roomID) { this.RoomID = roomID; }

    getRoomID() { return this.RoomID; }

    setAnswer(answer) { this.answer = answer; }

    getAnswer() { return this.answer; }

    getName() { return this.name; }

    getScore() { return this.score; }

    addScore(amount) { this.score += amount; }

    setScore(amount) { this.score = amount; }
}

module.exports = { Room, Player };