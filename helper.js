class Room {
    constructor(ID) {
        this.ID = ID;
        this.players = [];
    }

    addPlayer(player) {
        player.setRoomID(this.ID);
        this.players.push(player);
    }

    getPlayers() {
        return this.players;
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p !== player);
    }

    size() {
        return this.players.length;
    }    

    getID() {
        return this.ID;
    }
}

class Player {
    constructor(name, score) {
        this.name = name;
        this.score = score;
        this.RoomID = null;
    }

    setRoomID(roomID) {
        this.RoomID = roomID;
    }

    getRoomID() {
        return this.RoomID;
    }
}

module.exports = { Room, Player };