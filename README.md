# Poll.io

## Intro
A web app party game where players a shown are prompt, they write answers, and players vote on their favourite response! Points are given out, and the winner is determined at the end of the last the last round. I then deployed it using Google Cloud. Hope you enjoy! Unless I turned it off, it should be running here: www.polldotio.com

## Key Features 
- 8 player lobbies joinable by a room code
- Custom player names
- Configurable lobby settings
- Toggleable sets of different prompts (and randomized)
- Joinable mid-game

## Used Things
### Server
- Node.js
- Express
- Socket.io
### Client
- HTML
- CSS
- Javascript
### Deploy
- Google Cloud
### Others
- https://codepen.io/ (Helped me build the frontend)

## How to run: 
1. Run npm ci to install everything.
```
npm ci
```
2. Change the baseName variable in the server.js to if you're running it on your local machine. If you're not then you probably know what you're doing.
```
baseName = localhost:3000
```
3. Run npm start in the directory.
```
npm start
```
4. View it in your browser at:
localhost:3000
