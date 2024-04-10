const ws = new WebSocket('ws://localhost:3000');

const PLAYERSCONTAINER = document.querySelector('.player-container');
const ROUNDTIMERTEXT = document.querySelector('.round-timer')

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
        case "CHATBOXMESSAGERECEIVED":
            addMessageToChatbox(jsonParse.message, jsonParse.sender);
            break;
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
            VOTEROWCONTAINERS[0].appendChild(voteButton);
        }
        else {
            VOTEROWCONTAINERS[1].appendChild(voteButton);
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