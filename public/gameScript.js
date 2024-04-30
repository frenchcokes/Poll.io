
const socket = io('polliowebgameproject.uw.r.appspot.com');

const GAMETITLETEXT = document.querySelector('.title');
const OUTERCONTAINER = document.querySelector('.outer-container');
const UPPERBARCONTAINER = document.querySelector('.upper-bar-container');
const PROMPTCONTAINER = document.querySelector('.prompt-container');

const PLAYERSCONTAINER = document.querySelector('.player-container');

const ROUNDDISPLAYTEXT = document.querySelector('.round-display');
const TITLETEXT = document.getElementById("TITLETEXT");
const ROUNDTIMERTEXT = document.querySelector('.round-timer')

const RESULTSCONTAINER = document.querySelector('.results-container');
const FINALRESULTSHEADER = document.querySelector('.results-heading');
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

const GAMEMENUCONTAINER = document.getElementById("GAMEMENUCONTAINER");
const PROMPTTIME = document.getElementById("PROMPT-TIME");
const VOTETIME = document.getElementById("VOTE-TIME");
const RESULTTIME = document.getElementById("RESULT-TIME");
const ROUNDS = document.getElementById("ROUNDS");
const PACK1 = document.getElementById("PACK1");
const PACK2 = document.getElementById("PACK2");
const PACK3 = document.getElementById("PACK3");
const GAMESTARTBUTTON = document.getElementById("GAMESTARTBUTTON");
const ROOMCODE = document.getElementById("ROOMCODE");

const ROOMJOINCONTAINER = document.getElementById("ROOMJOINCONTAINER");
const ROOMJOINNAMEFIELD = document.getElementById("ROOMJOINNAMEFIELD");
const ROOMJOINCODEFIELD = document.getElementById("ROOMJOINCODEFIELD");
const ROOMJOINBUTTON = document.getElementById("ROOMJOINBUTTON");
const ROOMCREATEBUTTON = document.getElementById("ROOMCREATEBUTTON");

const CHATBOXMESSAGESCONTAINER = document.getElementById("CHAT-MESSAGES-CONTAINER");
const CHATBOXFIELD = document.getElementById("CHATBOX-FIELD");
const CHATBOXSEND = document.getElementById("CHATBOX-SEND");

const FEEDBACKTEXTFIELD = document.getElementById("FEEDBACKFIELD");
const FEEDBACKSENDBUTTON= document.getElementById("FEEDBACKSENDBUTTON");

const CREDITSLINK = document.getElementById("CREDITSLINK");
const TOSLINK = document.getElementById("TOSLINK");

socket.on("chatboxMessageReceived", (dataJson) => {
    addMessageToChatbox(dataJson.message, dataJson.sender);
});

socket.on("addLinks", (baseName) => {
    addLinks(baseName);
});

socket.on("updatePlayerButtons", (dataJson) => {
    updatePlayerButtons(dataJson.playerNames, dataJson.playerScores, dataJson.playerIndex);
});

socket.on('successfulPromptSubmission', () => {
    MESSAGEFIELD.style.visibility = "hidden";
    MESSAGESEND.style.visibility = "hidden";
});

socket.on("sendToMenu", (roomID) => {
    ROOMJOINCONTAINER.style.display = "none";
    GAMEMENUCONTAINER.style.display = "block";
    TITLETEXT.innerHTML = "Menu";
    ROOMCODE.value = roomID;
});

socket.on("startGame", (dataJson) => {
    startGame(dataJson.prompt, dataJson.round, dataJson.maxRounds);
});

socket.on("backToMenu", () => {
    backToMenu();
});

socket.on("voteResults", (dataJson) => {
    startResultsUI(dataJson.playerNames, dataJson.playerAnswers, dataJson.playerVotes, dataJson.scoreChanges);
});

socket.on("loop", (dataJson) => {
    setRoundCountdown(dataJson.time);
});

socket.on("startVotes", (dataJson) => {
    startVoteUI(dataJson.playerNames, dataJson.playerAnswers, dataJson.excludeIndex);
});

socket.on("finalResults", (dataJson) => {
    startFinalResultsUI(dataJson.playerNames, dataJson.playerScores);
});

socket.on("menuUpdate", (dataJson) => {
    updateGameMenu(dataJson);
});

socket.on("emptyChatbox", () => {
    emptyChatbox();
});

function backToMenu() {
    ROUNDDISPLAYTEXT.innerHTML = "";
    ROUNDTIMERTEXT.innerHTML = "";
    GAMEMENUCONTAINER.style.display = "block";
    RESULTSCONTAINER.style.display = "none";
    TITLETEXT.innerHTML = "Menu";
}

function startFinalResultsUI(playerNames, playerScores) {
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
        row.style.color = "#ffffff";
        var brElem = document.createElement("br");

        RESULTSTEXT.appendChild(row);
        RESULTSTEXT.appendChild(brElem);
    }
    TITLETEXT.innerHTML = "Final Results";
}

function addMessageToChatbox(messageText, sender) {
    const message = document.createElement('div');
    message.classList.add("chat-message");
    message.textContent = sender + ": " + messageText;

    CHATBOXMESSAGESCONTAINER.appendChild(message);
    CHATBOXMESSAGESCONTAINER.scrollTop = CHATBOXMESSAGESCONTAINER.scrollHeight;
}

function startGame(prompt, round, maxRounds) {
    hideAllGameElements();

    var playerBoxes = document.getElementsByClassName("player-box");
    for (var i = 0; i < playerBoxes.length; i++) {
        var toRemove = playerBoxes[i].getElementsByClassName("player-score-change-box");
        while(toRemove.length > 0) {
            playerBoxes[i].removeChild(toRemove[0]);
        }
    }

    MAINGAMEPLAY.style.display = "block";
    ROUNDDISPLAYTEXT.innerHTML = "Round " + (round + 1) + "/" + maxRounds;
    GAMEMENUCONTAINER.style.display = "none";
    PROMPTTEXT.style.display = "flex";
    VOTESCONTAINER.style.display = "flex";
    MESSAGECONTAINER.style.display = "flex";

    PROMPTTEXT.innerHTML = prompt;
    MESSAGEFIELD.style.visibility = "visible";
    MESSAGESEND.style.visibility = "visible";

    TITLETEXT.innerHTML = "Write an answer!";
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
        playerTitleDiv.style.color = "#ffffff";

        const playerScoreDiv = document.createElement('div');
        playerScoreDiv.classList.add('player-score');
        playerScoreDiv.textContent = playerScores[i];
        playerScoreDiv.style.color = "#ffffff";
        
        if(i == playerIndex) {
            playerBoxDiv.style.backgroundColor = "#42187e";
        }
        else {
            playerBoxDiv.style.backgroundColor = "#5149d3";
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
            socket.emit("promptSubmission", MESSAGEFIELD.value);
            MESSAGEFIELD.value = "";
        }
    }
}


function hideAllGameElements() {

    //Empty Voting Elements
    VOTEROWCONTAINERS[0].innerHTML = "";
    VOTEROWCONTAINERS[1].innerHTML = "";
    VOTESEND.style.visibility = "hidden";

    //Empty Message Input Elements
    MESSAGEFIELD.style.visibility = "hidden";
    MESSAGEFIELD.value = "";
    MESSAGESEND.style.visibility = "hidden";
}
main();
function main() {
    addListenersToMenu();
    addColors();
}

function addLinks(baseName) {
    CREDITSLINK.href ="http://" + baseName + "/credits"
    TOSLINK.href ="http://" + baseName + "/tos"
}

function addColors() {
    GAMETITLETEXT.style.color = "#ffffff";
    OUTERCONTAINER.style.backgroundColor = "#00906d";
    UPPERBARCONTAINER.style.backgroundColor = "#00d2a7";
    PROMPTCONTAINER.style.backgroundColor = "#7cecbe";
    PLAYERSCONTAINER.style.backgroundColor = "#7cecbe";

    ROOMJOINCONTAINER.style.backgroundColor = "#6cafe6";
    RESULTSCONTAINER.style.backgroundColor = "#6cafe6";
    GAMEMENUCONTAINER.style.backgroundColor = "#6cafe6";
    PROMPTCONTAINER.style.backgroundColor = "#6cafe6";
    VOTESCONTAINER.style.backgroundColor = "#6cafe6";

    ROUNDDISPLAYTEXT.style.color = "#ffffff";
    TITLETEXT.style.color = "#ffffff";
    ROUNDTIMERTEXT.style.color = "#ffffff";

    FINALRESULTSHEADER.style.color = "#ffffff";
}

function addListenersToMenu() {
    var inputFields = [PROMPTTIME, VOTETIME, RESULTTIME, ROUNDS, PACK1, PACK2, PACK3];
    var inputFieldsLength = inputFields.length;
    for(let i = 0; i < inputFieldsLength; i++) {
        inputFields[i].addEventListener("change", function() {
            socket.emit("menuUpdate", {
                promptTime: PROMPTTIME.value,
                voteTime: VOTETIME.value,
                resultTime: RESULTTIME.value,
                rounds: ROUNDS.value,
                isPack1: PACK1.checked,
                isPack2: PACK2.checked,
                isPack3: PACK3.checked
            });
        });
    }

    GAMESTARTBUTTON.addEventListener("click", function() {
        socket.emit("startGame", {
            promptTime: PROMPTTIME.value,
            voteTime: VOTETIME.value,
            resultTime: RESULTTIME.value,
            rounds: ROUNDS.value,
            isPack1: PACK1.checked,
            isPack2: PACK2.checked,
            isPack3: PACK3.checked
        });
    })

    VOTESEND.addEventListener("click", function() {
        if(selectedVoteButton !== -1) {
            socket.emit("voteSubmission", selectedVoteButton);
            
            VOTEROWCONTAINERS[0].innerHTML = "";
            VOTEROWCONTAINERS[1].innerHTML = "";
            VOTESEND.style.visibility = "hidden";
        }
    });

    CHATBOXSEND.addEventListener("click", function() {
        if(CHATBOXFIELD.value !== "") {
            socket.emit("chatboxSubmission", CHATBOXFIELD.value);
            
            addMessageToChatbox(CHATBOXFIELD.value, "You");

            CHATBOXFIELD.value = "";
        }
    });

    CHATBOXFIELD.addEventListener("keypress", function(event) {
        if(event.key === "Enter" && document.activeElement === CHATBOXFIELD) {
            if(CHATBOXFIELD.value !== "") {
                socket.emit("chatboxSubmission", CHATBOXFIELD.value);
                
                addMessageToChatbox(CHATBOXFIELD.value, "You");
    
                CHATBOXFIELD.value = "";
            }
        }
    });

    RESULTSNEXTGAMEBUTTON.addEventListener("click", function() {
        socket.emit("backToMenu");
    });

    ROOMJOINBUTTON.addEventListener("click", function() {
        if(ROOMJOINNAMEFIELD.value !== "" && ROOMJOINCODEFIELD.value !== "") {
            socket.emit("joinRoom", {
                playerName: ROOMJOINNAMEFIELD.value,
                roomID: ROOMJOINCODEFIELD.value
            });
            ROOMJOINNAMEFIELD.value = "";
            ROOMJOINCODEFIELD.value = "";
        }
    });

    ROOMCREATEBUTTON.addEventListener("click", function() {
        if(ROOMJOINNAMEFIELD.value !== "") {
            socket.emit("createRoom", ROOMJOINNAMEFIELD.value);
            ROOMJOINNAMEFIELD.value = "";
            ROOMJOINCODEFIELD.value = "";
        }
    });

    FEEDBACKSENDBUTTON.addEventListener("click", function() {
        FEEDBACKTEXTFIELD.placeholder = "Enter feedback here! (100 characters max)";
        if(FEEDBACKTEXTFIELD.value === "") {
            addMessageToChatbox("Please enter some feedback first!","Server");
            return;
        }
        if(FEEDBACKTEXTFIELD.value.length > 100) {
            addMessageToChatbox("Please make the feedback shorter!","Server");
            return;
        }
        socket.emit("feedbackSubmission", FEEDBACKTEXTFIELD.value);
        addMessageToChatbox("Feedback sent! Thanks!","Server");
        FEEDBACKTEXTFIELD.value="";
    });
}

var selectedVoteButton = -1;
function startVoteUI(playerNames, playerAnswers, excludeIndex) {
    hideAllGameElements();

    selectedVoteButton = -1;
    var numberOfButtons = playerNames.length;

    VOTESEND.style.visibility = "visible";

    VOTEROWCONTAINERS[0].innerHTML = "";
    VOTEROWCONTAINERS[1].innerHTML = "";
    buttons = [];
    for (var i = 0; i < numberOfButtons; i++) {
        if(i !== excludeIndex) {
            buttons.push(createVoteButton(i, " ", playerAnswers[i]));
        }
    }

    displayToRows(buttons, true);
    
    var divs = document.getElementsByClassName("vote-button");
    for (var i = 0; i < divs.length; i++) {
        (function(div) {
            div.addEventListener('click', function() {
                if(selectedVoteButton === -1) {
                    div.style.backgroundColor = "#42187e";
                    selectedVoteButton = div.id;
                } else if (selectedVoteButton === div.id) {
                    div.style.backgroundColor = "#5149d3";
                    selectedVoteButton = -1;
                } else if (selectedVoteButton !== div.id) {
                    for (var j = 0; j < divs.length; j++) {
                        divs[j].style.backgroundColor = "#5149d3";
                    }
                    div.style.backgroundColor = "#42187e";
                    selectedVoteButton = div.id;
                }
            });
        })(divs[i]);
    }
    MESSAGECONTAINER.style.display = "none";
    TITLETEXT.innerHTML = "Vote!";
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

    TITLETEXT.innerHTML = "Results!";
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
    playerScoreChangeBox.style.color = "#ffffff";

    playerContainers[index].appendChild(playerScoreChangeBox);
}

function createVoteButton(idValue, textContent, promptTextContent) {
    const voteButton = document.createElement('div');
    voteButton.classList.add('vote-button');
    voteButton.setAttribute("id", idValue);
    voteButton.style.backgroundColor = "#5149d3";

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

function emptyChatbox() {
    CHATBOXMESSAGESCONTAINER.innerHTML = "";
}