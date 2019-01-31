// Server bedrock
var express = require('express');
var sio  = require('socket.io');
var app = express();
app.use(express.static('client'));

// Setup function
var server = app.listen(process.env.PORT, function()
{
        console.log('Started serving');
        generateBoard();
        console.log("Generated board");
});

// Start listening
var io = sio.listen(server);
var socketConnections = 0;
var socketIds = [];
var gameState = "notReady";
var movedPeice = false;
var readyClients = 0;

// On new connection/disconnection
io.sockets.on('connection', function(socket)
{
        // Connection/Disconnection boring stuff
        console.log('New connection: ' + socket.id);
        socketConnections++;
        socketIds.push(socket.id);
        io.sockets.emit('connectionsUpdate', socketConnections);
        console.log('Number of connections: ' + socketConnections);
        var socketReady = false;
        socket.on('disconnect', function()
        {
                console.log('User disconnected: ' + socket.id);
                socketConnections--;
                if (socketReady) {
                        readyClients--;
                        io.sockets.emit('readyClients', readyClients);
                }
                io.sockets.emit('connectionsUpdate', socketConnections);
                removeFromArray(socketIds, socket.id);
                console.log('Number of connections: ' + socketConnections);
        });
        // Ready game
        socket.on('readyGame', function()
        {
                if (!socketReady) {
                        readyClients++;
                        io.sockets.emit('readyClients', readyClients);
                        console.log(socket.id + ' ready');
                }
                if (gameState == 'notReady' && readyClients == socketConnections) {
                        startGame(socketConnections);
                        io.sockets.emit('startGame', socketConnections);
                        rollValue = rollDice(6);
                        io.sockets.emit('rollValue', rollValue);
                        console.log('Rolled dice: ' + rollValue);
                        gameState = 'inProgress';
                }
        });
        socket.on('getClientCharacter', function()
        {
                socket.emit('newClientCharacter', socketIds.indexOf(socket.id));
        })
        // Update game state
        socket.on('gatherGameState', function()
        {
                io.sockets.emit('newState', gameState);
        });
        // Move an item
        socket.on('moveItem', function(index, x, y)
        {
                console.log('Req: move ' + hold[index].name + ' to position (' + x + ', ' + y + ')');
                if ( path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[x][y]) <= rollValue && board[x][y].obstacle == false && socket.id == hold[currentCharacter].socketId && !movedPeice) {
                        // Empty the cell holding bay
                        board[hold[index].i][hold[index].j].hold = -1;
                        // Set old cell obstacle value to false
                        board[hold[index].i][hold[index].j].obstacle = false;
                        // Change the x-pos and y-pos of the item
                        hold[index].i = x;
                        hold[index].j = y;
                        // Place the item in the new cell holding bay
                        board[x][y].hold = index;
                        // Set new cell obstacle value to true
                        board[x][y].obstacle = true;
                        console.log('Move committed')
                        movedPeice = true;
                        io.sockets.emit('clientMoveItem', index, x, y);
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
        socket.on('makeAccusation', function(suspect, weapon, room)
        {
                if (suspect == envelope[0] && weapon == envelope[1] && room == envelope[2]) {
                        // Accusation correct!
                        io.sockets.emit('accusationCorrect');
                        console.log(socket + ' (' + hold[currentCharacter].name + ') has won!');
                } else {
                        // Accusation incorrect...
                        io.sockets.emit('accusationIncorrect');
                        playersOut.push(currentCharacter);
                        console.log(socket.id + ' (' + hold[currentCharacter].name + ') made a false accusation!');
                }
        });
        // Suggestion
        socket.on('makeSuggestion', function(suspect, weapon, room) 
        {
                console.log(room)
                var cardsFound = false;
                for (var i = 0; i < hands.length; i++) {
                        if (!cardsFound && i != currentCharacter) {
                                if (isInArray(hands[i], suspect) || isInArray(hands[i], weapon) || isInArray(hands[i], room)) {
                                        // This player has a card to show
                                        cardsFound = true;
                                        console.log(hold[i].name + " has a card to show");
                                        io.to(socketIds[i]).emit('pickCard', hold[currentCharacter].name, suspect, weapon, room);
                                }
                        }
                }
                if (!cardsFound) {
                        console.log("No cards found in other player hands that match suggestion");
                        io.sockets.emit('noCardsFound', hold[currentCharacter].name, suspect, weapon, room);
                }
        });
        socket.on('pickedCard', function(card)
        {
                console.log("Showing " + card + " to " + hold[currentCharacter].name);
                io.to(socketIds[currentCharacter]).emit('showCard', card, socketIds.indexOf(socket.id));
        });
        socket.on('enterRoom', function(character, roomName, roomCode)
        {
                var i = hold[character].i;
                var j = hold[character].j;
                if (rooms[roomCode].doors == 1 && !movedPeice) {
                        var x = rooms[roomCode].doorOne[0];
                        var y = rooms[roomCode].doorOne[1];
                        if (path(board[i][j], board[x][y]) <= rollValue -1) {
                                rooms[roomCode].enter(character);
                        } else {
                                console.log(hold[character].name + ' rejected from entering room ' + roomName);
                        }
                } else if (rooms[roomCode].doors == 2 && !movedPeice) {
                        var x1 = rooms[roomCode].doorOne[0];
                        var y1 = rooms[roomCode].doorOne[1];
                        var x2 = rooms[roomCode].doorTwo[0];
                        var y2 = rooms[roomCode].doorTwo[1];
                        if (path(board[i][j], board[x1][y1]) <= rollValue -1 || path(board[i][j], board[x2][y2]) <= rollValue -1) {
                                rooms[roomCode].enter(character);
                        } else {
                                console.log(hold[character].name + ' rejected from entering room ' + roomName);
                        }
                } else if (movedPeice) {
                        console.log('Error: already moved peice')
                } else {
                        console.log('Error reading number of doors in room ' + roomName);
                }
        });
        socket.on('leaveRoom', function(character, roomCode, i, j) 
        {
                if (rooms[roomCode].doors == 1 && !movedPeice) {
                        var x = rooms[roomCode].doorOne[0];
                        var y = rooms[roomCode].doorOne[1];
                        if (path(board[x][y], board[i][j]) <= rollValue -1) {
                                rooms[roomCode].leave(character, i, j);
                        } else {
                                console.log(hold[character].name + ' rejected from leaving room ' + rooms[roomCode].name);
                        }
                } else if (rooms[roomCode].doors == 2 && !movedPeice) {
                        var x1 = rooms[roomCode].doorOne[0];
                        var y1 = rooms[roomCode].doorOne[1];
                        var x2 = rooms[roomCode].doorTwo[0];
                        var y2 = rooms[roomCode].doorTwo[1];
                        if (path(board[x1][y1], board[i][j]) <= rollValue -1 || path(board[x2][y2], board[i][j] <= rollValue -1)) {
                                rooms[roomCode].leave(character, i, j);
                        } else {
                                console.log(hold[character].name + ' rejected from leaving room ' + rooms[roomCode].name);
                        }
                } else if (movedPeice) {
                        console.log('Error: already moved peice');
                } else {
                        console.log('Error reading number of doors in room ' + rooms[roomCode].name);
                }
        });
});

// Global board variables
const COLS = 20;
const ROWS = 20;
var board = undefined;
var rollValue = 6;
var currentCharacter = 0;
var characters = undefined;
var hold = undefined;
var envelope = ['murderer', 'weapon', 'room'];
var suspectCards = ['Colonel Mustard', 'Professor Plum', 'Mr Green', 'Mrs Peacock', 'Miss Scarlet', 'Dr Orchid'];
var weaponCards = ['Knife', 'Candlestick', 'Revolver', 'Rope', 'Lead pipe', 'Spanner'];
var roomCards = ['Hall', 'Lounge', 'Dining room', 'Kitchen', 'Ballroom', 'Conservatory', 'Billiard room', 'Library', 'Study'];
var cardsCollated = [];
var hands = undefined;
var playersOut = [""];
const ROOM_CONST = 9;
var rooms = new Array(ROOM_CONST);
// Objects
function Cell(i, j) 
{
        // Cell position
        this.i = i;
        this.j = j;
        // Pathfinding variables
        this.f = this.g = this.h = 0;
        this.n = [];
        // Not an obstacle by default
        this.obstacle = false;
        // Cell holds nothing by default
        this.hold = -1;
        // Reset pathfinding variables
        this.pathInit = function() 
        {
                this.n = [];
                if (this.i < COLS - 1) {
                        this.n.push(board[this.i + 1][j]);
                }
                if (this.i > 0) {
                        this.n.push(board[this.i - 1][j]);
                }
                if (this.j < ROWS - 1) {
                        this.n.push(board[this.i][j + 1]);
                }
                if (this.j > 0) {
                        this.n.push(board[this.i][j - 1]);
                }
                this.f = this.g = this.h = 0;
        }
}
function Item(type, name, red, green, blue, i, j) 
{
        this.type = type;
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
                        board[hold[character].i][hold[character].j].hold = -1;
                        board[hold[character].i][hold[character].j].obstacle = false;
                        hold[character].room = index;
                        hold[character].i = hold[character].j = -1;
                        movedPeice = true;
                        io.sockets.emit('enterRoom', character, this.name, this.index);
                        console.log(hold[character].name + ' has entered room ' + this.name);
                }
        };
        this.leave = function(character, i, j)
        {
                removeFromArray(this.characters, character);
                hold[character].room = -1;
                hold[character].i = i;
                hold[character].j = j;
                board[i][j].hold = character;
                board[i][j].obstacle = true;
                console.log(hold[character].name + ' has left room ' + this.name);
                movedPeice = true;
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
// Return fresh board
function generateBoard() 
{
        // Wipe board and create array
        board = undefined;
        board = new Array(COLS);
        // Making a 2D array
        for (var i = 0; i < COLS; i++) {
                board[i] = new Array(ROWS);
        }
        // Creating cell objects
        for (var i = 0; i < COLS; i++) {
                for (var j = 0; j < ROWS; j++) {
                        board[i][j] = new Cell(i, j);
                }
        }
        // Outline the map
        horizontalObstacleLine(board[0][2], board[5][2]);
        verticalObstacleLine(board[5][0], board[5][2]);
        verticalObstacleLine(board[8][0], board[8][5]);
        horizontalObstacleLine(board[8][5], board[11][5]);
        verticalObstacleLine(board[11][0], board[11][5]);
        verticalObstacleLine(board[14][0], board[14][4]);
        horizontalObstacleLine(board[14][4], board[19][4]);
        horizontalObstacleLine(board[0][5], board[4][5]);
        verticalObstacleLine(board[5][6], board[5][8]);
        horizontalObstacleLine(board[0][9], board[4][9]);
        verticalObstacleLine(board[8][7], board[8][11]);
        horizontalObstacleLine(board[8][7], board[11][7]);
        verticalObstacleLine(board[11][7], board[11][11]);
        horizontalObstacleLine(board[8][11], board[11][11]);
        verticalObstacleLine(board[14][8], board[14][11]);
        horizontalObstacleLine(board[14][8], board[19][8]);
        horizontalObstacleLine(board[14][11], board[19][11]);
        horizontalObstacleLine(board[0][11], board[5][11]);
        verticalObstacleLine(board[5][11], board[5][14]);
        horizontalObstacleLine(board[0][14], board[5][14]);
        horizontalObstacleLine(board[0][17], board[4][17]);
        verticalObstacleLine(board[5][18], board[5][19]);
        horizontalObstacleLine(board[8][14], board[13][14]);
        verticalObstacleLine(board[8][14], board[8][19]);
        verticalObstacleLine(board[13][14], board[13][19]);
        horizontalObstacleLine(board[16][15], board[19][15]);
        verticalObstacleLine(board[16][15], board[16][19]);
}
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
function startGame(players)
{
        // Create characters and place on board
        characters = players;
        hold = new Array(characters);
        if (players > 0) {
                hold[0] = new Item("character", "Reverend Green", 0, 255, 0, 6, 0);
                board[6][0].hold = 0;
                board[6][0].obstacle = true;
        } if (players > 1) {
                hold[1] = new Item("character", "Miss Scarlet", 255, 36, 0, 12, 0);
                board[12][0].hold = 1;
                board[12][0].obstacle = true;
        } if (players > 2) {
                hold[2] = new Item("character", "Mrs Peacock", 9, 84, 190, 6, 19);
                board[6][19].hold = 2;
                board[6][19].obstacle = true;
        }
        for (var i = 0; i < characters; i++) {
                hold[i].socketId = socketIds[i];
        }
        // Shuffle cards
        suspectCards = shuffle(suspectCards);
        weaponCards = shuffle(weaponCards);
        roomCards = shuffle(roomCards);
        envelope[0] = suspectCards.splice(0, 1);
        envelope[1] = weaponCards.splice(0, 1);
        envelope[2] = roomCards.splice(0, 1);
        console.log("Murderer: " + envelope[0]);
        console.log("Weapon: " + envelope[1]);
        console.log("Room: " + envelope[2]);
        // Collate cards and shuffle
        console.log("Start handing out cards...");
        cardsCollated = suspectCards.concat(weaponCards);
        cardsCollated = cardsCollated.concat(roomCards);
        cardsCollated = shuffle(cardsCollated);
        hands = new Array(characters);
        for (var i = 0; i < characters; i++) {
                hands[i] = [];
        }
        handOut(cardsCollated);
        // Send them to the clients
        updateDecks();
        rooms[0] = new Room("Study", 0, 1, 5, 3);
        rooms[1] = new Room("Hall", 1, 2, 9, 6, 12, 4);
        rooms[2] = new Room("Lounge", 2, 1, 14, 5);
        rooms[3] = new Room("Library", 3, 2, 6, 7, 1, 10);
        rooms[4] = new Room("Dining room", 4, 2, 16, 7, 13, 9);
        rooms[5] = new Room("Billiard room", 5, 2, 2, 10, 6, 13);
        rooms[6] = new Room("Ballroom", 6, 2, 11, 13, 14, 15);
        rooms[7] = new Room("Kitchen", 7, 1, 17, 14);
        rooms[8] = new Room("Conservatory", 8, 1, 5, 17);
}
function nextTurn()
{
        nextCharacter();
        while (isInArray(playersOut, currentCharacter)) {
                nextCharacter();
        }
        io.sockets.emit('currentCharacterUpdate', currentCharacter);
        movedPeice = false;
        rollValue = rollDice(6);
        io.sockets.emit('rollValue', rollValue);
        console.log('Rolled dice: ' + rollValue);
}
function shuffle(array)
{
        var shuffledArray = [];
        var items = array.length;
        var i = undefined;
        var elt = undefined;
        // While items exist to shuffle
        while (items) {
                // Pick item from remaining array
                i = Math.floor(Math.random() * items);
                items--;
                // Take it
                elt = array.splice(i, 1)
                // Push it to new array
                shuffledArray.push(elt[0]);
        }
        return shuffledArray;
}
function handOut(array)
{
        var items = array.length;
        var i = 0;
        var elt = undefined;
        while (items) {
                elt = array.splice(0, 1);
                hands[i].push(elt[0]);
                items--;
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
        // For every player
        for (var i = 0; i < characters; i++) {
                var deckSize = hands[i].length;
                // Store their client id
                client = hold[i].socketId;
                for (var j = 0; j < deckSize; j++) {
                        // Send one card at a time to client
                        io.to(client).emit('newCard', hands[i][j]);
                }
        }
}
function isInArray(array, elt) 
{
        return array.indexOf(elt) > -1;
}
function nextCharacter()
{
        if (currentCharacter < characters - 1) {
                currentCharacter++;
        } else {
                currentCharacter = 0;
        }
}

// Pathfinding functions
function path(start, end) 
{
        // Initialise pathfinding variables
        for (var i = 0; i < COLS; i++) { 
                for (var j = 0; j < ROWS; j++) { 
                        board[i][j].pathInit(); 
                } 
        }
        var openSet = [];
        var closedSet = [];
        openSet.push(start);
        // Keep searching until no more left
        while (openSet.length > 0) {
                var lowestIndex = 0;
                for (var i = 0; i < openSet.length; i++) {
                        if (openSet[i].f < openSet[lowestIndex].f) {
                                lowestIndex = i;
                        }
                }
                var current = openSet[lowestIndex];
                if (openSet[lowestIndex] == end) {
                        // Shortest path found, return length
                        return openSet[lowestIndex].f;
                }
                removeFromArray(openSet, current);
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
        // No path found, return extreme length
        return 100;
}
function heuristic (a, b)
{
        // Manhattan heuristic
        return abs(a.i-b.i) + abs(a.j-a.j);
}
function removeFromArray (array, item) 
{
        // Go backwards through array, remove any items that are the same of the item passed
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
