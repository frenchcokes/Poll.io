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
        case "STARTVOTE":
            startVoteUI(jsonParse.players);
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


startVoteUI(["BOB", "JOHN", "MITCH", "SCOTT", "REEVES", "BOBBERT", "STEVEN", "MAX"], ["ROCKS", "SOCKS", "BLOCKS", "SPAGHETTI", "STEW", "BACON", "CHEDDAR", "PANTS"])
var selectedVoteButton = -1;
function startVoteUI(playerNames, playerAnswers) {
    var numberOfButtons = playerNames.length;

    var voteRows = document.getElementsByClassName("votes-row");
    for (var i = 0; i < numberOfButtons; i++) {
            const voteButton = document.createElement('div');
            voteButton.classList.add('vote-button');
            voteButton.setAttribute("id", i);

            const voteButtonVotesText = document.createElement('div');
            voteButtonVotesText.classList.add('vote-button-votes-text');
            voteButtonVotesText.textContent = " ";

            const voteButtonPromptText = document.createElement('div');
            voteButtonPromptText.classList.add('vote-button-prompt-text');
            voteButtonPromptText.textContent = playerAnswers[i];

            voteButton.appendChild(voteButtonVotesText);
            voteButton.appendChild(voteButtonPromptText);
        if(i < 4) {
            voteRows[0].appendChild(voteButton);
        }
        else {
            voteRows[1].appendChild(voteButton);
        }
    }

    var divs = document.getElementsByClassName("vote-button");
    for (var i = 0; i < divs.length; i++) {
        (function(div) {
            div.addEventListener('click', function() {
                if(selectedVoteButton === -1) {
                    div.style.backgroundColor = "rgb(255, 0, 0)";
                    selectedVoteButton = div.id;
                } else if (selectedVoteButton === div.id) {
                    div.style.backgroundColor = "rgb(0, 128, 0)";
                    selectedVoteButton = -1;
                } else if (selectedVoteButton !== div.id) {
                    divs[selectedVoteButton].style.backgroundColor = "rgb(0, 128, 0)";
                    div.style.backgroundColor = "rgb(255, 0, 0)";
                    selectedVoteButton = div.id;
                }
            });
        })(divs[i]);
    }
}
