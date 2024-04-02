const ws = new WebSocket('ws://localhost:3000');

const playerContainer = document.querySelector('.player-container');
const roundTimer = document.querySelector('.round-timer')

ws.onopen = () => {
    console.log('Successfully connected to server!');
}

ws.onmessage = (event) => {
    jsonParse = JSON.parse(event.data);
    switch(jsonParse.type) {
        case "UPDATE":
            updatePlayerButtons(jsonParse.numberOfPlayers, jsonParse.playerIndex);
            break;
        case "LOOP":
            setRoundCountdown(jsonParse.roundTime)
            break;
    }
}

function setRoundCountdown(roundTime) {
    currentTime = roundTime;
    var countdownFunction = setInterval(function() {
        roundTimer.textContent = "Time Remaining: " + roundTime;
        roundTime = roundTime - 1;
        if(roundTime < 0) {
            clearInterval(countdownFunction);
        }
    }, 1000)
}

function updatePlayerButtons(numberOfPlayers, playerIndex) {
    playerContainer.innerHTML = ''; //CLEARS CHILDREN
    const x = numberOfPlayers;
    for (let i = 0; i < x; i++) {

        const playerBoxDiv = document.createElement('div');
        playerBoxDiv.classList.add('player-box');

        const playerTitleDiv = document.createElement('div');
        playerTitleDiv.classList.add('player-title');
        playerTitleDiv.textContent = "PLAYER";

        const playerScoreDiv = document.createElement('div');
        playerScoreDiv.classList.add('player-score');
        playerScoreDiv.textContent = "SCORE";
        
        if(i == playerIndex) {
            playerBoxDiv.style.backgroundColor = "red";
        }

        playerBoxDiv.appendChild(playerTitleDiv);
        playerBoxDiv.appendChild(playerScoreDiv);
        playerContainer.appendChild(playerBoxDiv);

    }
}