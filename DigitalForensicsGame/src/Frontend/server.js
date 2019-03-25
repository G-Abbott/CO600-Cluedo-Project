//server.js is the file that Node.js will execute and listen to requests.

//Import express
var express = require('express');

//Import socket.io
var socket  = require('socket.io');

//Instance of express application 
var app = express();

//Use 'client' as the root directory from which to serve static files
app.use(express.static('client'));


//Server that listens for requests on port 4444
var server = app.listen(4444, function()
{
        console.log('Starting server on port 4444');
        //Create new game board
        createBoard();
        console.log("New game board created");
});

// socket.io to listen on 'server'
var io = socket.listen(server);
var socketConnections = 0;
var socketIds = [];
var status = "notReady";
var clientMoved = false;
var readyClients = 0;

io.sockets.on('connection', function(socket)
{
        // Connection
        console.log('New connection:' + socket.id);
        socketConnections++;
        socketIds.push(socket.id);
        io.sockets.emit('connectionUpdate', socketConnections);
        console.log('Connections: ' + socketConnections);
        var socketReady = false;
		
        // Disconnection
        socket.on('disconnect', function()
        {
                console.log('Client disconnected: ' + socket.id);
                socketConnections--;
                if (socketReady) {
                        readyClients--;
                        io.sockets.emit('readyClients', readyClients);
                }
                io.sockets.emit('connectionUpdate', socketConnections);
                arrayRemove(socketIds, socket.id);
                console.log('Connections: ' + socketConnections);
        });
        
        // Chat
        socket.on('chat', function(data){
        	io.emit('chat', data);
        });
        
        // Ready game
        socket.on('readyGame', function()
        {
                if (!socketReady) {
                        readyClients++;
                        io.sockets.emit('readyClients', readyClients);
                        console.log(socket.id + ' ready');
                }
                if (status == 'notReady' && readyClients == socketConnections) {
						//Require more than 1 player to start
						if (socketConnections>=2){
								startGame(socketConnections);
								io.sockets.emit('startGame', socketConnections);
								roll = rollDice(6);
								io.sockets.emit('roll', roll);
								console.log('Dice roll =  ' + roll);
								status = 'inProgress';
						}
                }
        });
        socket.on('getClientCharacter', function()
        {
                socket.emit('newCharacter', socketIds.indexOf(socket.id));
        })
		
        // Update game state
        socket.on('gatherStatus', function()
        {
                io.sockets.emit('newState', status);
        });
		
        // Move a player
        socket.on('moveCharacter', function(index, x, y)
        {
                console.log('Moving ' + details[index].name + ' to  (' + x + ', ' + y + ')');
                if ( path(board[details[currentCharacter].i][details[currentCharacter].j] , board[x][y]) <= roll && board[x][y].obstacle == false && socket.id == details[currentCharacter].socketId && !clientMoved) {
                        // Empty the coordinate
                        board[details[index].i][details[index].j].details = -1;
                        // Set old coordinate obstacle to false
                        board[details[index].i][details[index].j].obstacle = false;
                        // Change the x-pos and y-pos of the character
                        details[index].i = x;
                        details[index].j = y;
                        // Put character in new position
                        board[x][y].details = index;
                        // Set new coordinate obstacle value to true
                        board[x][y].obstacle = true;
                        console.log('Move committed')
                        clientMoved = true;
                        io.sockets.emit('clientMoveCharacter', index, x, y);
                } else {
                        console.log('Move denied')
                }
                console.log(playersOut)
        });
		
        // Next turn
        socket.on('nextTurn', function()
        {
                nextTurn();
        });
		
        // Accusation
        socket.on('makeAccusation', function(suspect, method, room)
        {
                if (suspect == envelope[0] && method == envelope[1] && room == envelope[2]) {
                        // Accusation correct!
                        io.sockets.emit('accusationCorrect');
                        console.log(socket + ' (' + details[currentCharacter].name + ') has won!');
                } else {
                        // Accusation incorrect...
                        io.sockets.emit('accusationIncorrect');
                        playersOut.push(currentCharacter);
                        console.log(socket.id + ' (' + details[currentCharacter].name + ') made a false accusation!');
                }
        });
        // Guess
        socket.on('makeGuess', function(suspect, method, room) 
        {
                var cardsFound = false;
                for (var i = 0; i < hands.length; i++) {
                        if (!cardsFound && i != currentCharacter) {
                                if (arrayContains(hands[i], suspect) || arrayContains(hands[i], method) || arrayContains(hands[i], room)) {
                                        // Other characters show their cards
                                        cardsFound = true;
                                        console.log(details[i].name + " has a card to show");
                                        io.to(socketIds[i]).emit('pickCard', details[currentCharacter].name, suspect, method, room);
                                }
                        }
                }
                if (!cardsFound) {
                        console.log("No cards found in other player hands that match suggestion");
                        io.sockets.emit('noCardsFound', details[currentCharacter].name, suspect, method, room);
                }
        });
		
        socket.on('pickedCard', function(card)
        {
                console.log("Showing " + card + " to " + details[currentCharacter].name);
                io.to(socketIds[currentCharacter]).emit('showCard', card, socketIds.indexOf(socket.id));
        });
		
        socket.on('enterRoom', function(character, roomName, roomIndex)
        {
                var i = details[character].i;
                var j = details[character].j;
                if (rooms[roomIndex].doors == 1 && !clientMoved) {
                        var x = rooms[roomIndex].doorOne[0];
                        var y = rooms[roomIndex].doorOne[1];
                        if (path(board[i][j], board[x][y]) <= roll -1) {
                                rooms[roomIndex].enter(character);
                        } else {
                                console.log(details[character].name + ' rejected from entering room ' + roomName);
                        }
                } else if (rooms[roomIndex].doors == 2 && !clientMoved) {
                        var x1 = rooms[roomIndex].doorOne[0];
                        var y1 = rooms[roomIndex].doorOne[1];
                        var x2 = rooms[roomIndex].doorTwo[0];
                        var y2 = rooms[roomIndex].doorTwo[1];
                        if (path(board[i][j], board[x1][y1]) <= roll -1 || path(board[i][j], board[x2][y2]) <= roll -1) {
                                rooms[roomIndex].enter(character);
                        } else {
                                console.log(details[character].name + ' rejected from entering room ' + roomName);
                        }
                } else if (clientMoved) {
                        console.log('Error: already moved')
                } else {
                        console.log('Error reading number of doors in room ' + roomName);
                }
        });
		
        socket.on('leaveRoom', function(character, roomIndex, i, j) 
        {
                if (rooms[roomIndex].doors == 1 && !clientMoved) {
                        var x = rooms[roomIndex].doorOne[0];
                        var y = rooms[roomIndex].doorOne[1];
                        if (path(board[x][y], board[i][j]) <= roll -1) {
                                rooms[roomIndex].leave(character, i, j);
                        } else {
                                console.log(details[character].name + ' rejected from leaving room ' + rooms[roomIndex].name);
                        }
                } else if (rooms[roomIndex].doors == 2 && !clientMoved) {
                        var x1 = rooms[roomIndex].doorOne[0];
                        var y1 = rooms[roomIndex].doorOne[1];
                        var x2 = rooms[roomIndex].doorTwo[0];
                        var y2 = rooms[roomIndex].doorTwo[1];
                        if (path(board[x1][y1], board[i][j]) <= roll -1 || path(board[x2][y2], board[i][j] <= roll -1)) {
                                rooms[roomIndex].leave(character, i, j);
                        } else {
                                console.log(details[character].name + ' rejected from leaving room ' + rooms[roomIndex].name);
                        }
                } else if (clientMoved) {
                        console.log('Error: already moved peice');
                } else {
                        console.log('Error reading number of doors in room ' + rooms[roomIndex].name);
                }
        });
});

// Server board variables
const columns = 24;
const rows = 24;
var board = undefined;
var roll = 6;
var currentCharacter = 0;
var characters = undefined;
var details = undefined;
var envelope = ['murderer', 'method', 'room'];
var suspectCards = ['Student', 'Lecturer', 'Administrator', 'Technician'];
var methodCards = ['Data Theft', 'Fraud', 'Malware', 'Brute Force', 'Man-in-the-middle', 'Phishing'];
var roomCards = ['Server Room', 'Seminar Room', 'Study Room', 'Main Hall', 'Convenors Office', 'Library', 'Admin Office', 'Lecture Theatre', 'Computer Suite'];
var cardsCollated = [];
var hands = undefined;
var playersOut = [""];
const roomNum = 9;
var rooms = new Array(roomNum);

function Coordinate(i, j) 
{
        // Coordinate position
        this.i = i;
        this.j = j;
		
        // Pathfinding variables
        this.f = this.g = this.h = 0;
        this.n = [];
		
        this.obstacle = false;
		
        // -1 States that the coordinate is empty
        this.details = -1;
		
        // Reset pathfinding variables
        this.pathInit = function() 
        {
                this.n = [];
                if (this.i < columns - 1) {
                        this.n.push(board[this.i + 1][j]);
                }
                if (this.i > 0) {
                        this.n.push(board[this.i - 1][j]);
                }
                if (this.j < rows - 1) {
                        this.n.push(board[this.i][j + 1]);
                }
                if (this.j > 0) {
                        this.n.push(board[this.i][j - 1]);
                }
                this.f = this.g = this.h = 0;
        }
}

function Character(name, red, green, blue, i, j) 
{
        this.name = name;
        this.socketId = undefined;
        this.r = red;
        this.g = green;
        this.b = blue;
        this.i = i;
        this.j = j;
        this.room = -1;
}

function Room(name, index, doors, x1, y1, x2, y2)
{
        this.name = name;
        this.index = index;
        this.characters = [];
        this.doors = doors;
        this.doorOne = [x1, y1];
        this.doorTwo = [x2, y2];
        this.enter = function(character) 
        {
                if (this.characters.indexOf(character) == -1) {
                        this.characters.push(character);
                        board[details[character].i][details[character].j].details = -1;
                        board[details[character].i][details[character].j].obstacle = false;
                        details[character].room = index;
                        details[character].i = details[character].j = -1;
                        clientMoved = true;
                        io.sockets.emit('enterRoom', character, this.name, this.index);
                        console.log(details[character].name + ' has entered ' + this.name);
                }
        };
        this.leave = function(character, i, j)
        {
                arrayRemove(this.characters, character);
                details[character].room = -1;
                details[character].i = i;
                details[character].j = j;
                board[i][j].details = character;
                board[i][j].obstacle = true;
                console.log(details[character].name + ' has left ' + this.name);
                clientMoved = true;
                io.sockets.emit('leaveRoom', this.index, character, i, j)
        }
        this.pathFrom = function(i, j, roll)
        {
                if (doors == 1) {
                        console.log("one door");
                        if (path( board[this.doorOne[0]][this.doorOne[1]] , board[i][j]) <= roll -1) {
                                return true;
                        } else {
                                return false;
                        }
                } else if ((path(board[this.doorOne[0]][this.doorOne[1]], board[i][j]) <= roll -1) || (path(board[this.doorTwo[0]][this.doorTwo[1]], board[i][j]) <= roll -1)) {
                        return true;
                } else {
                        return false;
                }
        };
};
// Create new game board
function createBoard() 
{
        // Clear board
        board = undefined;
        board = new Array(columns);
		
		// Creating coordinates
        for (var i = 0; i < columns; i++) {
                board[i] = new Array(rows);
        }
        for (var i = 0; i < columns; i++) {
                for (var j = 0; j < rows; j++) {
                        board[i][j] = new Coordinate(i, j);
                }
        }
        
        // Define the board
        
		//Server room
        horizontalObstacleLine(board[0][3], board[6][3]);
        verticalObstacleLine(board[6][0], board[6][3]);
        
        //Seminar room
        horizontalObstacleLine(board[9][6], board[14][6]);
        verticalObstacleLine(board[9][0], board[9][6]);
        verticalObstacleLine(board[14][0], board[14][6]);
        
        //Study room
        horizontalObstacleLine(board[17][6], board[23][6]);
        verticalObstacleLine(board[17][0], board[23][6]);
        
        //Convenors office
        horizontalObstacleLine(board[16][9], board[23][9]);
        horizontalObstacleLine(board[16][15], board[19][15]);
        horizontalObstacleLine(board[20][16], board[23][20]);
        verticalObstacleLine(board[16][9], board[16][15]);
        
        //Computer suite
        horizontalObstacleLine(board[18][19], board[23][19]);
        verticalObstacleLine(board[18][19], board[18][23]);

		//Lecture theatre        
        horizontalObstacleLine(board[8][17], board[15][17]);
        verticalObstacleLine(board[8][17], board[8][23]);
        verticalObstacleLine(board[15][17], board[16][23]);
        
        //Admin office
        horizontalObstacleLine(board[0][19], board[5][19]);
        verticalObstacleLine(board[5][19], board[5][23]);
        
        //Library
        horizontalObstacleLine(board[0][16], board[5][16]);
        horizontalObstacleLine(board[0][12], board[5][12]);
        verticalObstacleLine(board[5][12], board[5][16]);
        
        //Main hall
        horizontalObstacleLine(board[0][6], board[5][6]);
        horizontalObstacleLine(board[0][10], board[5][10]);
        verticalObstacleLine(board[6][7], board[6][9]);
        
        //Middle 
        horizontalObstacleLine(board[9][8], board[13][8]);
        horizontalObstacleLine(board[9][14], board[13][14]);
        verticalObstacleLine(board[13][8], board[13][14]);        
        verticalObstacleLine(board[9][8], board[9][14]); 
}

//Functions to draw room edges
function horizontalObstacleLine(start, end) 
{
        var length = end.i - start.i
        for (i = 0; i <= length; i++) {
                board[start.i + i][start.j].obstacle = true;
        }
}

function verticalObstacleLine(start, end) 
{
        var length = end.j - start.j
        for (i = 0; i <= length; i++) {
                board[start.i][start.j + i].obstacle = true;
        }
}

//Start game
function startGame(players)
{
        // Depending on number of connections, create that many players and set their positions
        characters = players;
        details = new Array(characters);
        if (players > 0) {
                details[0] = new Character("Student", 0, 255, 0, 7, 0);
                board[7][0].details = 0;
                board[7][0].obstacle = true;    
        } if (players > 1) {
                details[1] = new Character("Lecturer", 255, 36, 0, 16, 0);
                board[16][0].details = 1;
                board[16][0].obstacle = true;
        } if (players > 2) {
                details[2] = new Character("Administrator", 9, 84, 190, 6, 23);
                board[6][23].details = 2;
                board[6][23].obstacle = true;
        } if (players > 3) {
                details[3] = new Character("Technician", 162, 0, 204, 17, 23);
                board[17][23].details = 3;
                board[17][23].obstacle = true;
        }
        for (var i = 0; i < characters; i++) {
                details[i].socketId = socketIds[i];
        }
		
        // Shuffle cards
        suspectCards = shuffle(suspectCards);
        methodCards = shuffle(methodCards);
        roomCards = shuffle(roomCards);
		
		// Choose envelope 
        envelope[0] = suspectCards.splice(0, 1);
        envelope[1] = methodCards.splice(0, 1);
        envelope[2] = roomCards.splice(0, 1);
        console.log("Murderer: " + envelope[0]);
        console.log("Weapon: " + envelope[1]);
        console.log("Room: " + envelope[2]);
		
        // Deal out all of the cards
        console.log("Dealing cards");
        cardsCollated = suspectCards.concat(methodCards);
        cardsCollated = cardsCollated.concat(roomCards);
        cardsCollated = shuffle(cardsCollated);
        hands = new Array(characters);
        for (var i = 0; i < characters; i++) {
                hands[i] = [];
        }
        handOut(cardsCollated);
        updateDecks();
        // (name, index, doors, x1, y1, x2, y2)
        rooms[0] = new Room("Server Room", 0, 1, 6, 4);
        rooms[1] = new Room("Seminar room", 1, 2, 8, 4, 11, 7);
        rooms[2] = new Room("Study Room", 2, 1, 17, 7);
        rooms[3] = new Room("Main Hall", 3, 2, 7, 8, 3, 11);        
        rooms[4] = new Room("Convenors Office", 4, 2, 17, 8, 15, 13);
        rooms[5] = new Room("Library", 5, 2, 0, 11, 6, 14);
        rooms[6] = new Room("Admin Office", 6, 1, 5, 18);        
        rooms[7] = new Room("Lecture Theatre", 7, 2, 7, 19, 16, 19);        
        rooms[8] = new Room("Computer Suite", 8, 1, 19, 18);
}

function nextTurn()
{
        nextCharacter();
        while (arrayContains(playersOut, currentCharacter)) {
                nextCharacter();
        }
        io.sockets.emit('updateCurrentCharacter', currentCharacter);
        clientMoved = false;
        roll = rollDice(6);
        io.sockets.emit('roll', roll);
        console.log('Dice Roll = ' + roll);
}

function shuffle(array)
{
        var shuffledCards = [];
        var cards = array.length;
        var i = undefined;
        var card = undefined;
        while (cards) {
                i = Math.floor(Math.random() * cards);
                cards--;
                card = array.splice(i, 1)
                shuffledCards.push(card[0]);
        }
        return shuffledCards;
}

function handOut(array)
{
        var cards = array.length;
        var i = 0;
        var card = undefined;
        while (cards) {
                card = array.splice(0, 1);
                hands[i].push(card[0]);
                cards--;
                if (i < characters - 1) {
                        i++;
                } else {
                        i = 0;
                }
        }
}

function updateDecks()
{
        var client = undefined;
        for (var i = 0; i < characters; i++) {
                var deckSize = hands[i].length;
                client = details[i].socketId;
                for (var j = 0; j < deckSize; j++) {
                        // Send one card at a time to client
                        io.to(client).emit('giveCard', hands[i][j]);
                }
        }
}

function arrayContains(array, element) 
{
        return array.indexOf(element) > -1;
}

function nextCharacter()
{
        if (currentCharacter < characters - 1) {
                currentCharacter++;
        } else {
                currentCharacter = 0;
        }
}

// Pathfinding algorithm
function path(start, end) 
{
        // Initialise pathfinding variables
        for (var i = 0; i < columns; i++) { 
                for (var j = 0; j < rows; j++) { 
                        board[i][j].pathInit(); 
                } 
        }
        var openSet = [];
        var closedSet = [];
        openSet.push(start);
        // While has moves left
        while (openSet.length > 0) {
                var lowestIndex = 0;
                for (var i = 0; i < openSet.length; i++) {
                        if (openSet[i].f < openSet[lowestIndex].f) {
                                lowestIndex = i;
                        }
                }
                var current = openSet[lowestIndex];
                if (openSet[lowestIndex] == end) {
                        // Return shortest path
                        return openSet[lowestIndex].f;
                }
                arrayRemove(openSet, current);
                closedSet.push(current);
                var neighbours = current.n;
                for (var i = 0; i < neighbours.length; i++) {
                        var neighbour = neighbours[i];
                        if (!closedSet.includes(neighbour) && !neighbour.obstacle) {
                                var tentative_g = current.g + 1;
                                if (openSet.includes(neighbour)) {
                                        if (tentative_g < neighbour.g) {
                                                neighbour.g = tentative_g;
                                        }
                                } else {
                                        neighbour.g = tentative_g;
                                        openSet.push(neighbour);
                                }
                        neighbour.h = heuristic(neighbour, end);
                        neighbour.f = neighbour.g + neighbour.h;
                        }
                }
        }
        // No path found
        return 100;
}

function heuristic (a, b)
{
        return abs(a.i-b.i) + abs(a.j-a.j);
}

function arrayRemove (array, item) 
{
        for (var i = array.length - 1; i >= 0; i--) {
                if (array[i] == item) {
                        array.splice(i, 1);
                }
        }
}

function abs(number) 
{
        if (number < 0) {
                return -number;
        } else {
                return number;
        }
}

function rollDice(sides)
{
        var roll = Math.floor(Math.random() * sides) + 1;
        return roll;
}
