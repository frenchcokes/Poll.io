const ws = new WebSocket('ws://localhost:3000');

const PLAYERSCONTAINER = document.querySelector('.player-container');
const ROUNDTIMERTEXT = document.querySelector('.round-timer')
const ROUNDDISPLAYTEXT = document.querySelector('.round-display');

const RESULTSCONTAINER = document.querySelector('.results-container');
const RESULTSTEXT = document.querySelector('.results');
const RESULTSNEXTGAMEBUTTON = document.querySelector('.results-next-game');

const MAINGAMEPLAY = document.querySelector('.main-gameplay');
const PROMPTTEXT = document.getElementById("PROMPT");

const VOTESCONTAINER = document.getElementById("VOTESCONTAINER");
const VOTEROWCONTAINERS = document.getElementsByClassName("votes-row");
const VOTESEND = document.getElementById("VOTES-INPUT-SEND");

const MESSAGECONTAINER = document.getElementById("FORMSUBMIT");
const MESSAGEFIELD = document.getElementById("MESSAGE-INPUT");
const MESSAGESEND = document.getElementById("MESSAGE-SEND");

const CHATBOXMESSAGESCONTAINER = document.getElementById("CHAT-MESSAGES-CONTAINER");
const CHATBOXFIELD = document.getElementById("CHATBOX-FIELD");
const CHATBOXSEND = document.getElementById("CHATBOX-SEND");

const PROMPTTIME = document.getElementById("PROMPT-TIME");
const VOTETIME = document.getElementById("VOTE-TIME");
const RESULTTIME = document.getElementById("RESULT-TIME");
const ROUNDS = document.getElementById("ROUNDS");

const PACK1 = document.getElementById("PACK1");
const PACK2 = document.getElementById("PACK2");
const PACK3 = document.getElementById("PACK3");

const GAMEMENUCONTAINER = document.getElementById("GAMEMENUCONTAINER");

const GAMESTARTBUTTON = document.getElementById("GAMESTARTBUTTON");

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
            startResultsUI(jsonParse.playerNames, jsonParse.playerAnswers, jsonParse.playerVotes, jsonParse.scoreChanges);
            break;
        case "FINALRESULTS":
            startFinalResultsUI(jsonParse.playerNames, jsonParse.playerScores);
            break;
        case "CHATBOXMESSAGERECEIVED":
            addMessageToChatbox(jsonParse.message, jsonParse.sender);
            break;
        case "BACKTOMENU":
            backToMenu();
            break;
    }
}

function backToMenu() {
    GAMEMENUCONTAINER.style.display = "block";
    RESULTSCONTAINER.style.display = "none";
}

function startFinalResultsUI(playerNames, playerScores) {
    //Implement me!
    var playerBoxes = document.getElementsByClassName("player-box");
    for (var i = 0; i < playerBoxes.length; i++) {
        var toRemove = playerBoxes[i].getElementsByClassName("player-score-change-box")[0];
        playerBoxes[i].removeChild(toRemove);
    }

    MAINGAMEPLAY.style.display = "none";
    RESULTSCONTAINER.style.display = "block";
    RESULTSTEXT.innerHTML = "";

    //Bubblesort algorithm
    var len = playerScores.length;
    for (var i = 0; i < len; i++) {
        for (var j = 0; j < len - 1; j++) {
            if (playerScores[j] < playerScores[j + 1]) {
                var temp = playerScores[j];
                playerScores[j] = playerScores[j + 1];
                playerScores[j + 1] = temp;

                var temp2 = playerNames[j];
                playerNames[j] = playerNames[j + 1];
                playerNames[j + 1] = temp2;
            }
        }
    }

    var scoreLen = playerNames.length;
    for (var i = 0; i < scoreLen; i++) {
        var row = document.createElement("span");
        row.textContent = (i + 1) + ". " + playerNames[i] + " (" + playerScores[i] + ")";
        var brElem = document.createElement("br");

        RESULTSTEXT.appendChild(row);
        RESULTSTEXT.appendChild(brElem);
    }
}

function addMessageToChatbox(messageText, sender) {
    const message = document.createElement('div');
    message.classList.add("chat-message");
    message.textContent = sender + ": " + messageText;

    CHATBOXMESSAGESCONTAINER.appendChild(message);
}

function startGame(jsonParse) {
    hideAllGameElements();

    var playerBoxes = document.getElementsByClassName("player-box");
    for (var i = 0; i < playerBoxes.length; i++) {
        var toRemove = playerBoxes[i].getElementsByClassName("player-score-change-box");
        while(toRemove.length > 0) {
            playerBoxes[i].removeChild(toRemove[0]);
        }
    }

    ROUNDDISPLAYTEXT.innerHTML = "Round " + jsonParse.round;
    GAMEMENUCONTAINER.style.display = "none";
    PROMPTTEXT.style.display = "flex";
    VOTESCONTAINER.style.display = "flex";
    MESSAGECONTAINER.style.display = "flex";

    PROMPTTEXT.innerHTML = jsonParse.prompt;
    MESSAGEFIELD.style.visibility = "visible";
    MESSAGESEND.style.visibility = "visible";
}

function setRoundCountdown(roundTime) {
    ROUNDTIMERTEXT.textContent = "Time Remaining: " + roundTime;
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
    PLAYERSCONTAINER.innerHTML = ''; //CLEARS CHILDREN
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
        PLAYERSCONTAINER.appendChild(playerBoxDiv);

    }

    //
    MESSAGESEND.addEventListener("click", function() {
        attemptToSend();
    });
    MESSAGEFIELD.addEventListener("keypress", function(event) {
        if(event.key === "Enter" && document.activeElement === MESSAGEFIELD) {
            attemptToSend();
        }
    })

    function attemptToSend() {
        if(MESSAGEFIELD.value !== "") {
            const data = {
                type: "PROMPTSUBMISSION",
                prompt: MESSAGEFIELD.value
            }
            MESSAGEFIELD.value = "";
            MESSAGEFIELD.style.visibility = "hidden";
            MESSAGESEND.style.visibility = "hidden";
            ws.send(JSON.stringify(data));
        }
    }
}


function hideAllGameElements() {
    //Empty Prompt
    PROMPTTEXT.innerText = "";

    //Empty Voting Elements
    VOTEROWCONTAINERS[0].innerHTML = "";
    VOTEROWCONTAINERS[1].innerHTML = "";
    VOTESEND.style.visibility = "hidden";

    //Empty Message Input Elements
    MESSAGEFIELD.style.visibility = "hidden";
    MESSAGEFIELD.value = "";
    MESSAGESEND.style.visibility = "hidden";
}

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

    VOTESEND.addEventListener("click", function() {
        if(selectedVoteButton !== -1) {
            const d = {
                type: "VOTESUBMISSION",
                voteIndex: selectedVoteButton
            }
            ws.send(JSON.stringify(d));
            
            VOTEROWCONTAINERS[0].innerHTML = "";
            VOTEROWCONTAINERS[1].innerHTML = "";
            VOTESEND.style.visibility = "hidden";
        }
    });

    CHATBOXSEND.addEventListener("click", function() {
        if(CHATBOXFIELD.value !== "") {
            const d = {
                type: "CHATBOXSUBMISSION",
                message: CHATBOXFIELD.value
            }
            ws.send(JSON.stringify(d));
            
            addMessageToChatbox(CHATBOXFIELD.value, "You");

            CHATBOXFIELD.value = "";
        }
    });

    CHATBOXFIELD.addEventListener("keypress", function(event) {
        if(event.key === "Enter" && document.activeElement === CHATBOXFIELD) {
            if(CHATBOXFIELD.value !== "") {
                const d = {
                    type: "CHATBOXSUBMISSION",
                    message: CHATBOXFIELD.value
                }
                ws.send(JSON.stringify(d));
                
                addMessageToChatbox(CHATBOXFIELD.value, "You");
    
                CHATBOXFIELD.value = "";
            }
        }
    });

    RESULTSNEXTGAMEBUTTON.addEventListener("click", function() {
        const d = {
            type: "BACKTOMENU"
        }
        ws.send(JSON.stringify(d));
    })
}
addListenersToMenu();

var selectedVoteButton = -1;
function startVoteUI(playerNames, playerAnswers) {
    hideAllGameElements();

    //SHOW PROMPT
    PROMPTTEXT.innerText = "PROMPT";

    selectedVoteButton = -1;
    var numberOfButtons = playerNames.length;

    VOTESEND.style.visibility = "visible";

    VOTEROWCONTAINERS[0].innerHTML = "";
    VOTEROWCONTAINERS[1].innerHTML = "";
    buttons = [];
    for (var i = 0; i < numberOfButtons; i++) {
            buttons.push(createVoteButton(i, " ", playerAnswers[i]));
    }

    displayToRows(buttons, true);
    
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
                    for (var j = 0; j < divs.length; j++) {
                        divs[j].style.backgroundColor = "rgb(0, 128, 0)";
                    }
                    div.style.backgroundColor = "rgb(255, 0, 0)";
                    selectedVoteButton = div.id;
                }
            });
        })(divs[i]);
    }


}

function startResultsUI(playerNames, playerAnswers, votes, scoreChanges) {
    VOTEROWCONTAINERS[0].innerHTML = "";
    VOTEROWCONTAINERS[1].innerHTML = "";
    VOTESEND.style.visibility = "hidden";

    voteButtons = [];
    for (var i = 0; i < playerAnswers.length; i++) {
        var displayString = playerNames[i] + " (" + votes[i] + ")";
        voteButtons.push(createVoteButton(-1, displayString, playerAnswers[i]));
    }
    displayToRows(voteButtons, false);

    displayScoreChanges(scoreChanges);
}

//HELPER FUNCTIONS
function displayScoreChanges(scoreChanges) {
    for (var i = 0; i < scoreChanges.length; i++) {
        displayScoreChangeForPlayer(i, scoreChanges[i]);
    }
}

function displayScoreChangeForPlayer(index, magnitude) {
    var playerContainers = document.getElementsByClassName("player-box");

    const playerScoreChangeBox = document.createElement("div");
    playerScoreChangeBox.classList.add("player-score-change-box");
    playerScoreChangeBox.innerText = "(+" + magnitude + ")";

    playerContainers[index].appendChild(playerScoreChangeBox);
}

function createVoteButton(idValue, textContent, promptTextContent) {
    const voteButton = document.createElement('div');
    voteButton.classList.add('vote-button');
    voteButton.setAttribute("id", idValue);

    const voteButtonVotesText = document.createElement('div');
    voteButtonVotesText.classList.add('vote-button-votes-text');
    voteButtonVotesText.textContent = textContent;

    const voteButtonPromptText = document.createElement('div');
    voteButtonPromptText.classList.add('vote-button-prompt-text');
    voteButtonPromptText.textContent = promptTextContent;

    voteButton.appendChild(voteButtonVotesText);
    voteButton.appendChild(voteButtonPromptText);
    return voteButton;
}

function displayToRows(buttons, isRandom) {
    randomOrder = [];
    if(isRandom === true) {
        while(randomOrder.length < buttons.length) {
            index = Math.floor(Math.random() * buttons.length);
            if(randomOrder.includes(index) === false) {
                randomOrder.push(index);
            }
        }
        for (var i = 0; i < buttons.length; i++) {
            if(i < 4) {
                VOTEROWCONTAINERS[0].appendChild(buttons[randomOrder[i]]);
            }
            else {
                VOTEROWCONTAINERS[1].appendChild(buttons[randomOrder[i]]);
            }
        }
    } else if(isRandom === false) {
        for (var i = 0; i < buttons.length; i++) {
            if(i < 4) {
                VOTEROWCONTAINERS[0].appendChild(buttons[i]);
            }
            else {
                VOTEROWCONTAINERS[1].appendChild(buttons[i]);
            }
        }
    }

}