const ws = new WebSocket('ws://localhost:3000');

const playerContainer = document.querySelector('.player-container');
const roundTimer = document.querySelector('.round-timer')

const promptText = document.getElementsByClassName("prompt")[0];

const votesContainer = document.getElementById("VOTESCONTAINER");
const voteRows = document.getElementsByClassName("votes-row");
const voteInputSendButton = document.getElementsByClassName("votes-input-send")[0];

const messageInputContainer = document.getElementById("FORMSUBMIT");
const messageInput = document.getElementsByClassName("message-input")[0];
const messageInputSend = document.getElementsByClassName("message-input-send")[0];

var PROMPTTIME = document.getElementById("PROMPT-TIME");
var VOTETIME = document.getElementById("VOTE-TIME");
var RESULTTIME = document.getElementById("RESULT-TIME");
var ROUNDS = document.getElementById("ROUNDS");

var PACK1 = document.getElementById("PACK1");
var PACK2 = document.getElementById("PACK2");
var PACK3 = document.getElementById("PACK3");

var GAMEMENUCONTAINER = document.getElementById("GAMEMENUCONTAINER");

var GAMESTARTBUTTON = document.getElementById("GAMESTARTBUTTON");

ws.onopen = () => {
    console.log('Successfully connected to server!');
}

ws.onmessage = (event) => {
    jsonParse = JSON.parse(event.data);
    switch(jsonParse.type) {
        case "MENUUPDATE":
            updateGameMenu(jsonParse);
            break;
        case "STARTGAME":
            startGame(jsonParse);
            break;
        case "MENU":
            //startGameMenuUI(jsonParse);
            break;
        case "UPDATE":
            updatePlayerButtons(jsonParse.playerNames, jsonParse.playerScores, jsonParse.playerIndex);
            break;
        case "LOOP":
            setRoundCountdown(jsonParse.roundTime)
            break;
        case "STARTVOTE":
            startVoteUI(jsonParse.playerNames, jsonParse.playerAnswers);
            break;
        case "VOTERESULTS":
            break;
        case "FINALRESULTS":
            break;
    }
}

function startGame(jsonParse) {
    hideAllGameElements();
    GAMEMENUCONTAINER.style.display = "none";
    promptText.style.display = "flex";
    votesContainer.style.display = "flex";
    messageInputContainer.style.display = "flex";

    promptText.innerHTML = jsonParse.prompt;
    messageInput.style.visibility = "visible";
    messageInputSend.style.visibility = "visible";
}

function setRoundCountdown(roundTime) {
    roundTimer.textContent = "Time Remaining: " + roundTime;
}

function updateGameMenu(jsonParse) {
    PROMPTTIME.value = jsonParse.promptTime;
    VOTETIME.value = jsonParse.voteTime;
    RESULTTIME.value = jsonParse.resultTime;
    ROUNDS.value = jsonParse.rounds;

    PACK1.checked = jsonParse.isPack1;
    PACK2.checked = jsonParse.isPack2;
    PACK3.checked = jsonParse.isPack3;
}

function updatePlayerButtons(playerNames, playerScores, playerIndex) {
    playerContainer.innerHTML = ''; //CLEARS CHILDREN
    const x = playerNames.length;

    for (let i = 0; i < x; i++) {

        const playerBoxDiv = document.createElement('div');
        playerBoxDiv.classList.add('player-box');

        const playerTitleDiv = document.createElement('div');
        playerTitleDiv.classList.add('player-title');
        playerTitleDiv.textContent = playerNames[i];

        const playerScoreDiv = document.createElement('div');
        playerScoreDiv.classList.add('player-score');
        playerScoreDiv.textContent = playerScores[i];
        
        if(i == playerIndex) {
            playerBoxDiv.style.backgroundColor = "red";
        }

        playerBoxDiv.appendChild(playerTitleDiv);
        playerBoxDiv.appendChild(playerScoreDiv);
        playerContainer.appendChild(playerBoxDiv);

    }

    //
    messageInputSend.addEventListener("click", function() {
        attemptToSend();
    });
    messageInput.addEventListener("keypress", function(event) {
        if(event.keyCode === 13 && document.activeElement === messageInput) {
            attemptToSend();
        }
    })

    function attemptToSend() {
        if(messageInput.value !== "") {
            const data = {
                type: "PROMPTSUBMISSION",
                prompt: messageInput.value
            }
            messageInput.value = "";
            ws.send(JSON.stringify(data));
        }
    }
}


function hideAllGameElements() {
    //Empty Prompt
    promptText.innerText = "";

    //Empty Voting Elements
    voteRows[0].innerHTML = "";
    voteRows[1].innerHTML = "";
    voteInputSendButton.style.visibility = "hidden";

    //Empty Message Input Elements
    messageInput.style.visibility = "hidden";
    messageInput.value = "";
    messageInputSend.style.visibility = "hidden";
}

/*
startGameMenuUI() {

}
*/

function addListenersToMenu() {
    var inputFields = [PROMPTTIME, VOTETIME, RESULTTIME, ROUNDS, PACK1, PACK2, PACK3];
    var inputFieldsLength = inputFields.length;
    for(let i = 0; i < inputFieldsLength; i++) {
        inputFields[i].addEventListener("change", function() {
            const data = {
                type: "MENUUPDATE",
                promptTime: PROMPTTIME.value,
                voteTime: VOTETIME.value,
                resultTime: RESULTTIME.value,
                rounds: ROUNDS.value,
                isPack1: PACK1.checked,
                isPack2: PACK2.checked,
                isPack3: PACK3.checked
            }
            ws.send(JSON.stringify(data));
        });
    }

    GAMESTARTBUTTON.addEventListener("click", function() {
        const data = {
            type: "STARTGAME",
            promptTime: PROMPTTIME.value,
            voteTime: VOTETIME.value,
            resultTime: RESULTTIME.value,
            rounds: ROUNDS.value,
            isPack1: PACK1.checked,
            isPack2: PACK2.checked,
            isPack3: PACK3.checked
        }
        ws.send(JSON.stringify(data));
    })
}
addListenersToMenu();

var selectedVoteButton = -1;
function startVoteUI(playerNames, playerAnswers) {
    hideAllGameElements();

    //SHOW PROMPT
    promptText.innerText = "PROMPT";

    selectedVoteButton = -1;
    var numberOfButtons = playerNames.length;

    voteInputSendButton.style.visibility = "visible";
    voteRows[0].innerHTML = "";
    voteRows[1].innerHTML = "";
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