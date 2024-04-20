class Room {
    constructor(ID) {
        this.ID = ID;
        this.players = [];
        this.currentRound = 0;
        this.responseCounter = [];
        this.scoreChanges = [];
        this.currentResponses = 0;
        //Settings
        this.promptTime = -1;
        this.voteTime = -1;
        this.resultTime = -1;
        this.rounds = -1;

        this.isPack1 = false;
        this.isPack2 = false;
        this.isPack3 = false;

        this.intervalID = null;
        this.time = 0;

        this.resetResponseVoteCounter();
    }

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

    resetPlayerAnswers() { this.players.forEach(p => p.setAnswer("Quarter Pounder with Cheese")); }

    resetPlayerScores() { this.players.forEach(p => p.setScore(0));}

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

    addScoreChangeToIndex(index, amount) {
        this.scoreChanges[index] = this.scoreChanges[index] + amount;
    }

    addVoteToCounterIndex(index) { this.responseCounter[index]++; }

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
        this.answer = "Quarter Pounder with Cheese";
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