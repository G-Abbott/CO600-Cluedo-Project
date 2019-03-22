p5.dom;

// Declaring variables & constants & objects
var canvas = undefined;
const CANVAS_WIDTH = 480 + 480 ;
const CANVAS_HEIGHT = 504;
const COLS = 24;
const ROWS = 24;
var board = new Array(COLS);
var gridGraphics = undefined;
const GRID_WIDTH = 480;
const GRID_HEIGHT = 480;
var charactersGraphics = undefined;
const CHARACTERS_WIDTH = 480;
const CHARACTERS_HEIGHT = 24;
var characters = 1;
var hold = undefined;
var rollValue = 6;
var currentCharacter = 0;
var gameState = undefined;
const MAJOR_MISC_WIDTH = 480;
const MAJOR_MISC_HEIGHT = 480;
var socket = io.connect("localhost:4444");
var clientCharacter = undefined;
var connections = 1;
var readyStatus = "NOT READY";
var readyClients = 0;
var gotClientHoldValue = false;
var clientHand = [];
var movedPeice = false;
var selectingScenario = false;
var scenarioContext = undefined;
var scenario = ["", "", ""];
var suspectCards = ['Student', 'Lecturer', 'Administrator', 'Technician'];
var weaponCards = ['Data Theft', 'Fraud', 'Malware', 'Brute Force', 'Man-in-the-middle', 'Phishing'];
var roomCards = ['Server Room', 'Seminar Room', 'Study Room', 'Main Hall', 'Convenors Office', 'Library', 'Admin Office', 'Lecture Theatre', 'Computer Suite'];
var pickFrom = ["", "", ""];
var pickingCards = false;
const ROOM_CONST = 9;
var rooms = new Array(ROOM_CONST);

window.onload = function(){
//Query DOM
var message = document.getElementById('message');
	handle = document.getElementById('handle');
	btn = document.getElementById('send');
	output = document.getElementById('output');

//Emit events
	
btn.addEventListener('click', function(){
	socket.emit('chat', {
		message: message.value,
		handle: handle.value
	});
});
};

//Listen for events
socket.on('chat', function(data){
	output.innerHTML += '<p><strong>' + data.handle + ': <strong>' + data.message + '</p>';
});

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
        // Show the cell
        this.show = function() 
        {
                gridGraphics.fill(255,216,101);
                gridGraphics.stroke(0);
                if (this.hold == -1) {
                        gridGraphics.strokeWeight(0.5);
                        gridGraphics.rect(this.i * (GRID_WIDTH / COLS), this.j * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                } else {
                        hold[this.hold].show();
                }
        }
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
        this.r = red;
        this.g = green;
        this.b = blue;
        this.i = i;
        this.j = j;
        this.room = -1;
        // Show item
        this.show = function() 
        {
                gridGraphics.fill(this.r, this.g, this.b);
                gridGraphics.noStroke;
                gridGraphics.strokeWeight(0);
                gridGraphics.rect(this.i * (GRID_WIDTH / COLS), this.j * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
        }
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
                        hold[character].room = index;
                        
                        board[hold[character].i][hold[character].j].hold = -1;
                        board[hold[character].i][hold[character].j].obstacle = false;
                        
                        hold[character].i = hold[character].j = -1;
                        movedPeice = true;
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
                movedPeice = true;
                console.log(hold[character].name + ' has left room ' + this.name);
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
        this.show = function()
        {
                if (this.name == "Server Room") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(4 * (GRID_WIDTH / COLS), 1 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Seminar Room") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(10 * (GRID_WIDTH / COLS), 4 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Study Room") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(18 * (GRID_WIDTH / COLS), 3 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Main Hall") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(3 * (GRID_WIDTH / COLS), 8 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Convenors Office") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(18 * (GRID_WIDTH / COLS), 13 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Library") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(3 * (GRID_WIDTH / COLS), 14 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Admin Office") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(4 * (GRID_WIDTH / COLS), 20 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Lecture Theatre") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(12 * (GRID_WIDTH / COLS), 20 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Computer Suite") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(20 * (GRID_WIDTH / COLS), 20 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                }
        };
}
// Load game assets
function preload() 
{
        console.log("Fetching assets...");
        socket.on('newState', function(newState)
        {
                gameState = newState;
        });
        socket.emit('gatherGameState');
        console.log("Placing listeners...");
        socket.on('startGame', function(players)
        {
                startGame(players);
                gameState = 'inProgress';
                socket.emit('getClientCharacter');
        });
        socket.on('newClientCharacter', function(holdValue)
        {
                clientCharacter = holdValue;
                console.log('client character ' + clientCharacter);
                gotClientHoldValue = true;
                
        });
        socket.on('clientMoveItem', function(index, x, y)
        {
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
                movedPeice = true;
        });
        socket.on('currentCharacterUpdate', function(update)
        {
                currentCharacter = update;
                movedPeice = false;
                scenario = ["", "", ""];
        });
        socket.on('connectionsUpdate', function(update)
        {
                connections = update;
        });
        socket.on('readyClients', function(update)
        {
                readyClients = update;
        })
        socket.on('rollValue', function(roll)
        {
                rollValue = roll;
                console.log('New roll value from server: ' + rollValue);
        });
        socket.on('newCard', function(card)
        {
                clientHand.push(card);
        });
        socket.on('accusationCorrect', function()
        {
                window.alert(hold[currentCharacter].name + ' wins the game!');
                selectingScenario = false;

        });
        socket.on('accusationIncorrect', function()
        {
                window.alert(hold[currentCharacter].name + ' is out of the game after a false accusation...');
                selectingScenario = false;
        });
        socket.on('noCardsFound', function(name, suspect, weapon, room)
        {
                window.alert(name + " suggested " + suspect + " with " + weapon + " in " + room + " and found no one with those cards");
        });
        socket.on('pickCard', function (name, suspect, weapon, room)
        {
                window.alert(name + " suggested " + suspect + " with " + weapon + " in " + room + ", please pick card to show player");
                pickFrom[0] = suspect;
                pickFrom[1] = weapon;
                pickFrom[2] = room;
                pickingCards = true;
        });
        socket.on('showCard', function(card, index)
        {
                window.alert(hold[index].name + " shows you card " + card);
        });
        socket.on('enterRoom', function(character, roomName, roomCode)
        {
                rooms[roomCode].enter(character);
        });
        socket.on('leaveRoom', function(roomCode, character, i, j)
        {
                rooms[roomCode].leave(character, i, j);
        });
}

// Setup game    
function setup()
{
        console.log("Setting up...")
        // Init graphic canvas and buffers
        canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        gridGraphics = createGraphics(GRID_WIDTH, GRID_HEIGHT);
        charactersGraphics = createGraphics(CHARACTERS_WIDTH, CHARACTERS_HEIGHT);
        majorMiscGraphics = createGraphics(MAJOR_MISC_WIDTH, MAJOR_MISC_HEIGHT);
        //Define buttons, begin by hiding them
        //Ready Button
        readyB = createButton('Click here when ready');
        readyB.position(535,110);
        readyB.mousePressed(ready);
        readyB.hide();
        //Arrow buttons - to do
        /*
        buttonUp = createButton(String.fromCharCode(30));
        buttonUp.position(800, 105);
        buttonUp.mousePressed(moveUp);
        buttonUp.hide();
        buttonDown = createButton(String.fromCharCode(31));
        buttonDown.position(800, 155);
        buttonDown.mousePressed(moveDown);
        buttonDown.hide();
        buttonLeft = createButton(String.fromCharCode(17));
        buttonLeft.position(750, 135);
        buttonLeft.mousePressed(moveLeft);
        buttonLeft.hide();
        buttonRight = createButton(String.fromCharCode(16));
        buttonRight.position(850, 135);
        buttonRight.mousePressed(moveRight);
        buttonRight.hide();
        */
        //End turn button
        endTurnB = createButton('End Turn');
        endTurnB.position(400,481);
        endTurnB.mousePressed(endTurn);
        endTurnB.hide();
	//Enter Room button
	enterRoomB = createButton('Enter Room');
        enterRoomB.position(300,481);
        enterRoomB.mousePressed(enterRoom);
        enterRoomB.hide();
	//Cancel button
	cancelB = createButton('Cancel');
        cancelB.position(510, 480);
        cancelB.mousePressed(cancel);
        cancelB.hide();
        //Make accusation and guess buttons
        accusationB = createButton('Make Accusation');
        accusationB.position(510, 400 + clientHand.length * 20 + 20);
        accusationB.mousePressed(makeAccusation);
        accusationB.hide();
        guessB = createButton('Make Guess');
        guessB.position(510, 400 + clientHand.length * 20 + 50);
        guessB.mousePressed(makeGuess);
        guessB.hide();
        // create game board
        createBoard();
        console.log("Setup complete")
}
function startGame(players)
{
        characters = players;
        hold = new Array(characters);
        if (players > 0) {
                hold[0] = new Item("character", "Student", 0, 255, 0, 7, 0);
                board[7][0].hold = 0;
                board[7][0].obstacle = true;    
        } if (players > 1) {
                hold[1] = new Item("character", "Lecturer", 255, 36, 0, 16, 0);
                board[16][0].hold = 1;
                board[16][0].obstacle = true;
        } if (players > 2) {
                hold[2] = new Item("character", "Administrator", 9, 84, 190, 6, 23);
                board[6][23].hold = 2;
                board[6][23].obstacle = true;
        } if (players > 3) {
                hold[3] = new Item("character", "Technician", 162, 0, 204, 17, 23);
                board[17][23].hold = 3;
                board[17][23].obstacle = true;
        }
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
function createBoard() 
{
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
        
		//server room
        horizontalObstacleLine(board[0][3], board[6][3]);
        verticalObstacleLine(board[6][0], board[6][3]);
        
        //seminar room
        horizontalObstacleLine(board[9][6], board[14][6]);
        verticalObstacleLine(board[9][0], board[9][6]);
        verticalObstacleLine(board[14][0], board[14][6]);
        
        //study room
        horizontalObstacleLine(board[17][6], board[23][6]);
        verticalObstacleLine(board[17][0], board[23][6]);
        
        //convenors office
        horizontalObstacleLine(board[16][9], board[23][9]);
        horizontalObstacleLine(board[16][15], board[19][15]);
        horizontalObstacleLine(board[20][16], board[23][20]);
        verticalObstacleLine(board[16][9], board[16][15]);
        
        //computer suite
        horizontalObstacleLine(board[18][19], board[23][19]);
        verticalObstacleLine(board[18][19], board[18][23]);

		//lecture theatre        
        horizontalObstacleLine(board[8][17], board[15][17]);
        verticalObstacleLine(board[8][17], board[8][23]);
        verticalObstacleLine(board[15][17], board[16][23]);
        
        //admin office
        horizontalObstacleLine(board[0][19], board[5][19]);
        verticalObstacleLine(board[5][19], board[5][23]);
        
        //library
        horizontalObstacleLine(board[0][16], board[5][16]);
        horizontalObstacleLine(board[0][12], board[5][12]);
        verticalObstacleLine(board[5][12], board[5][16]);
        
        //main hall
        horizontalObstacleLine(board[0][6], board[5][6]);
        horizontalObstacleLine(board[0][10], board[5][10]);
        verticalObstacleLine(board[6][7], board[6][9]);
        
        //middle 
        horizontalObstacleLine(board[9][8], board[13][8]);
        horizontalObstacleLine(board[9][13], board[13][13]);
        verticalObstacleLine(board[13][8], board[13][13]);        
        verticalObstacleLine(board[9][8], board[9][13]);        
		     
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

// Draw graphics
function draw() 
{
        // Draw board
        for (var i = 0; i < COLS; i++) {
                for (var j = 0; j < ROWS; j++) { 
                        board[i][j].show(); 
                }
        }
        drawBoardDetails();
        // Reset drawing
        gridGraphics.stroke(0)
        gridGraphics.strokeWeight(1)
        // Draw game details
        if (gameState == "inProgress") {
			    endTurnB.hide();
				enterRoomB.hide();
                // Highlight where the player can go
                if (mouseX < 480 && mouseY < 480 && currentCharacter == clientCharacter && !movedPeice) {
                        if (hold[currentCharacter].i > -1) {
                                var x = Math.floor(mouseX / 480 * COLS);
                                var y = Math.floor(mouseY / 480 * ROWS);
                                if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[x][y]) <= rollValue && board[x][y].obstacle == false) {
                                        gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b, 72);
                                        gridGraphics.rect(x * (GRID_WIDTH / COLS), y * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                                }
                        } else if (hold[currentCharacter].i == -1) {
                                var x = Math.floor(mouseX / 480 * COLS);
                                var y = Math.floor(mouseY / 480 * ROWS);
                                if (rooms[hold[currentCharacter].room].pathFrom(x, y, rollValue -1) && !board[x][y].obstacle) {
                                        gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b, 72);
                                        gridGraphics.rect(x * (GRID_WIDTH / COLS), y * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                                }
                        }
                }
                // Character ticker
                charactersGraphics.background(0);
                for (var i = 0; i < characters; i++) {
                        ellipseMode(CENTER);
                        if (i == currentCharacter) {
                                charactersGraphics.fill(hold[i].r, hold[i].g, hold[i].b);
                        } else {
                                charactersGraphics.fill(hold[i].r, hold[i].g, hold[i].b, 72);
                        }
                        charactersGraphics.ellipse((12 + 24 * i), 12, 20);
                }
                // Ticker text
                charactersGraphics.fill(255);
                charactersGraphics.text(hold[currentCharacter].name + "'s turn", 12 + 24 * characters, 18);
                // End turn button
                if (currentCharacter == clientCharacter) {
                        endTurnB.show();
						enterRoomB.show();
                }
        }
        
        // Draw major misc
        majorMiscGraphics.background(255);
        if (gameState == "notReady") {
                majorMiscGraphics.text(readyClients + ' out of ' + connections + ' clients are ready', 30, 30);
                majorMiscGraphics.text('Game will start when all players are ready', 30, 50);
                majorMiscGraphics.text('Click READY when you are ready to play', 30, 70);
                majorMiscGraphics.text('Your client status: ' + readyStatus, 30, 90);
                readyB.show();

        }
        if (gameState == "inProgress" && gotClientHoldValue) {
                /*
                buttonUp.show();
                buttonDown.show();
                buttonLeft.show();
                buttonRight.show();
                */
                readyB.hide();
				cancelB.hide();
                if (selectingScenario) {
						cancelB.show();
                        majorMiscGraphics.text('MAKING ACCUSATION', 30, 30);
                        majorMiscGraphics.text('Selection ONE card from each category', 30, 50);
                        if (scenario[0].length < 1) {
                                // List suspects
                                for (var i = 0; i < suspectCards.length; i++) {
                                        majorMiscGraphics.text(suspectCards[i], 60, 70 + 20*i);
                                }
                        } else if (scenario[1].length < 1) {
                                // List weapons
                                for (var i = 0; i < weaponCards.length; i++) {
                                        majorMiscGraphics.text(weaponCards[i], 60, 70 + 20*i);
                                }
                        } else if (scenario[2].length < 1) {
                                // List rooms
                                for (var i = 0; i < roomCards.length; i++) {
                                        majorMiscGraphics.text(roomCards[i], 60, 70 + 20*i);
                                }
                        } else {
                                // Error, all cards already chosen
                                majorMiscGraphics.text('All scenario cards chosen, please wait...', 30, 70);
                        }
                } else if (pickingCards) {
                        majorMiscGraphics.text('Pick a card to privately show to ' + hold[currentCharacter].name, 30, 30);
                        for (var i = 0; i < pickFrom.length; i++) {
                                majorMiscGraphics.text(pickFrom[i], 50, 50 + 20 * i);
                        }
                        
                } else {
                        majorMiscGraphics.text('Game started with ' + characters + ' players', 30, 30);
                        majorMiscGraphics.text('Your character is ' + hold[clientCharacter].name, 30, 50);
                        if (clientCharacter == currentCharacter) {
                                majorMiscGraphics.text('You rolled a ' + rollValue, 30, 70);
                        } else {
                                majorMiscGraphics.text(hold[currentCharacter].name + ' rolled a ' + rollValue, 30, 70);
                        }
                        majorMiscGraphics.text('The cards in your (private) hand are:', 30, 90);
                        for (var i = 0; i < clientHand.length; i++) {
                                majorMiscGraphics.text(clientHand[i], 50, 110 + i*20);
                        }
                        accusationB.show();
                        guessB.show();
                }
        }
        // Draw rooms
        if (gameState == "inProgress") {
                for (var i = 0; i < ROOM_CONST; i++) {
                        rooms[i].show();
                }
        }
        copy(gridGraphics, 0, 0, 480, 480, 0, 0, 480, 480);
        copy(charactersGraphics, 0, 0, 480, 24, 0, 480, 480, 24);
        copy(majorMiscGraphics, 0, 0, 480, 480, 480, 0, 480, 480);
}
function drawBoardDetails() 
{
        // Server Room
        gridGraphics.fill(0, 0, 0);
        gridGraphics.strokeWeight(1);
        gridGraphics.line(7*20 -1, 0 -1, 7*20 -1, 4*20 -1);
        gridGraphics.line(0 -1, 4*20 -1, 7*20 -1, 4*20 -1);
        gridGraphics.fill(239,176,184);
        gridGraphics.rect(0 -1, 0 -1, 7*20 -1, 4*20 -1);
        // Seminar Room
        gridGraphics.fill(0, 0, 0);
        gridGraphics.line(9*20 , 0 , 9*20 , 7*20 - 1);
        gridGraphics.line(15*20-1, 0 , 15*20-1, 7*20 - 1);
        gridGraphics.line(9*20 - 1, 7*20 - 2, 15*20 - 1, 7*20 - 2);
        gridGraphics.fill(254,242,202);
        gridGraphics.rect( 9*20  , 0 - 1, 6*20 - 2, 7*20 - 1);
        // Study Room
        gridGraphics.fill(0, 0, 0);
        gridGraphics.line(17*20, 0, 17*20, 7*20 -1);
        gridGraphics.line(336, 120-1, 480, 120-1);
        gridGraphics.fill(227,239,217);
        gridGraphics.rect(17*20, 0 -1, 7*20 -1, 7*20-1);
        // Middle
        gridGraphics.stroke(0);
        gridGraphics.line(190,8*20,280,160);
        gridGraphics.line(280,160,280,280);
        gridGraphics.line(280,280,180,280);
        gridGraphics.line(180,280,180,160);
              
        gridGraphics.fill(179,198,231);
        gridGraphics.rect(9*20 , 8*20, 5*20-1, 6*20-1);
        gridGraphics.strokeWeight(1);
        // Main Hall
        gridGraphics.fill(0,0,0);
        gridGraphics.line(0, 120, 120 - 1, 120);
        gridGraphics.line(120 -2, 120, 120 -2, 7*20);
        gridGraphics.line(120 -1, 7*20, 7*20-1, 7*20);
        gridGraphics.line(7*20-2, 7*20, 7*20-2, 200 -1);
        gridGraphics.line(7*20 -2, 200-2, 120-2, 200-2);
        gridGraphics.line(120-2, 200-2, 120-2, 220-2);
        gridGraphics.line(0 -1, 220-2, 120-1, 220-2);
        gridGraphics.fill(222,234,246);
        gridGraphics.rect(-1, 120, 120-1, 100 -2);
        gridGraphics.stroke(222,234,246);
        gridGraphics.rect(120-3, 140+1, 20, 60-4);
        // Convenors Office
        gridGraphics.fill(0);
        gridGraphics.stroke(0);
        gridGraphics.line(320, 180, 480, 180);
        gridGraphics.line(320, 180, 320, 320);
        gridGraphics.line(320, 320, 400, 320);
        gridGraphics.line(400, 320, 400, 340);
        gridGraphics.line(400, 340, 480, 340);      
        gridGraphics.fill(240,192,240);
        gridGraphics.stroke(240,192,240);
        gridGraphics.rect(320+1, 180+1, 80-2, 140-3);
        gridGraphics.stroke(240,192,240);
        gridGraphics.rect(400+1, 180+1, 80-3, 160-3);
        gridGraphics.rect(330, 190, 140, 120);

        // Library
        gridGraphics.fill(0);
        gridGraphics.stroke(0);
        gridGraphics.line(0, 240, 120 -1, 240);
        gridGraphics.line(120 -2, 240, 120-2, 340 -1);
        gridGraphics.line(0, 340 -2, 120 -2, 340 -2);
        gridGraphics.fill(243,203,238);
        gridGraphics.rect(0 -1, 240, 120 -1, 100 -2);
        // Admin Office
        gridGraphics.fill(0);
        gridGraphics.stroke(0);
        gridGraphics.line(0, 380, 120, 380);
        gridGraphics.line(120, 380, 120, 380+(20*6));
        gridGraphics.fill(251,227,215);
        gridGraphics.stroke(255);
        gridGraphics.rect(0, 380+1, 120 -2, 100 -3);
        // Lecture theatre
        gridGraphics.fill(0);
        gridGraphics.stroke(0);
        gridGraphics.line(160-2, 340, 160+(8*20) -1, 340);
        gridGraphics.line(160 -2, 340, 160-2, 340+(7*20));
        gridGraphics.line(320 -2, 340, 320-2, 340+(7*20));
        gridGraphics.fill(240,185,182);
        gridGraphics.rect(160, 340, 160-2, 140 -1);
        // Computer Suite
        gridGraphics.fill(0);
        gridGraphics.line(360, 380, 480, 380);
        gridGraphics.line(360, 380, 360, 480);
        gridGraphics.fill(216,216,216);
        gridGraphics.rect(360, 380, 120-1, 100 -1);
        // Text
        gridGraphics.noFill(255);
        gridGraphics.noStroke();
        gridGraphics.textSize(12);
        gridGraphics.stroke(0);
        gridGraphics.text("Server Room", 10, 20);
        gridGraphics.text("Seminar Room", 200, 20);
        gridGraphics.text("Study Room", 400, 20);
        gridGraphics.text("Main Hall", 10, 140);
        gridGraphics.text("Convenors Office", 360, 210);
        gridGraphics.text("Library", 10, 280);
        gridGraphics.text("Admin Office", 10, 425);
        gridGraphics.text("Lecture Theatre", 200, 360);
        gridGraphics.text("Computer Suite", 370, 420);
        // Doors
        gridGraphics.stroke(255,216,101);
        gridGraphics.strokeWeight(4);
        //server room door1
        gridGraphics.line(6*20 , 4*20 , 7*20 , 4*20 );
        //main hall door 1
        gridGraphics.line(7*20 , 8*20, 7*20, 9*20 );
        //main hall door 2
        gridGraphics.line(3*20 , 11*20, 4*20 , 11*20 );
        //library door 1
        gridGraphics.line(0*20 , 12*20, 1*20 , 12*20 );
		//library door 2
        gridGraphics.line(6*20 , 14*20, 6*20, 15*20 );
		//admin office door 1
        gridGraphics.line(5*20 , 19*20, 6*20 , 19*20 );
		//lecture Theatre door 1
        gridGraphics.line(8*20 , 19*20, 8*20, 20*20 );
        //doors 2 and 3 are not possible - max 2 doors currently
        //lecture theatre door 2
        //gridGraphics.line(10*20 , 17*20, 11*20, 17*20 );
		//lecture theatre door 3        
        //gridGraphics.line(13*20 , 17*20, 14*20, 17*20 );
		//lecture theatre door 4
        gridGraphics.line(16*20 , 19*20, 16*20, 20*20 );
		//computer suite door 1
        gridGraphics.line(19*20 , 19*20, 20*20, 19*20 );
		//convenors office door 1		
        gridGraphics.line(16*20 , 13*20, 16*20, 14*20 );
		//convenors office door 2
        gridGraphics.line(17*20 , 9*20, 18*20, 9*20 );
        //study room door 1
        gridGraphics.line(17*20 , 7*20, 18*20, 7*20 );
        //seminar room door 1
        gridGraphics.line(11*20 , 7*20, 12*20, 7*20 );
		//seminar room door 2
        gridGraphics.line(9*20 , 4*20, 9*20, 5*20 );
}
function mouseClicked() 
{
        if (mouseX < 480 && mouseY < 480) {
			// Calculate the x-pos and y-pos of the mouse with respect to the grid
			var x = Math.floor(mouseX / 480 * COLS);
			var y = Math.floor(mouseY / 480 * ROWS);
			// If path short enough with respect to roll value and destination not an obstacle, move item && if not in room
			if (hold[currentCharacter].i > -1) {
				if ( path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[x][y]) <= rollValue && board[x][y].obstacle == false && currentCharacter == clientCharacter && !movedPeice) {
					socket.emit('moveItem',currentCharacter, x, y);
				}
			}
			if (hold[currentCharacter].i == -1) {
				var roomIndex = hold[currentCharacter].room;
				if(rooms[roomIndex].pathFrom(x, y, rollValue)) {
					socket.emit('leaveRoom', currentCharacter, roomIndex, x, y);
				}
			}	
		}
        // Major Misc
        if (!selectingScenario && !pickingCards) {
                if (mouseX > 480 + 30 && mouseX < 480 + 30 + 300 && mouseY > 110 + clientHand.length * 20 + 20 && mouseY < 110 + clientHand.length * 20 + 40 && currentCharacter == clientCharacter) {
                        // Make an accusation
                        scenarioContext = "accusation";
                        selectingScenario = true;
                }
                if (mouseX > 480 + 30 && mouseX < 480 + 30 + 300 && mouseY > 110 + clientHand.length * 20 && mouseY < 110 + clientHand.length * 20 + 20 && currentCharacter == clientCharacter) {
                        if (hold[currentCharacter].room > -1) {
                                // Make a mere suggestion
                                scenarioContext = "suggestion";
                                selectingScenario = true;
                        }
                }
        } else if (pickingCards) {
                if (mouseX > 540 && mouseX < 700 && mouseY > 30 && mouseY < pickFrom.length * 20 + 35) {
                        var index = Math.floor((mouseY - 35)/20);
                        if (isInArray(clientHand, pickFrom[index])) {
                                socket.emit('pickedCard', pickFrom[index]);
                                pickingCards = false;
                                pickFrom = ["", "", ""];
                        }
                }
        } else {
                // Chose cards
                if (scenario[0].length < 1) {
                        // Chosing a suspect
                        if (mouseX > 540 && mouseX < 700 && mouseY > 50 && mouseY < suspectCards.length * 20 + 55) {
                                var index = Math.floor((mouseY - 55)/20);
                                scenario[0] = suspectCards[index];
                        }
                } else if (scenario[1].length < 1) {
                        // Chosing a weapon
                        if (mouseX > 540 && mouseX < 700 && mouseY > 50 && mouseY < weaponCards.length * 20 + 55) {
                                var index = Math.floor((mouseY - 55)/20);
                                scenario[1] = weaponCards[index];
                        }
                } else if (scenario[2].length < 2) {
                        // Chosing a room
                        if (mouseX > 540 && mouseX < 700 && mouseY > 50 && mouseY < roomCards.length * 20 + 55) {
                                var index = Math.floor((mouseY - 55)/20);
                                if (rooms[hold[currentCharacter].room].name == roomCards[index]) {
                                        scenario[2] = roomCards[index];
                                        if (scenarioContext == "accusation") {
                                                socket.emit('makeAccusation', scenario[0], scenario[1], scenario[2]);
                                        } else if (scenarioContext == "suggestion") {
                                                socket.emit("makeSuggestion", scenario[0], scenario[1], scenario[2]);
                                                selectingScenario = false;
                                        }
                                }
                        }
                }
        }
}
function isInArray(array, elt) 
{
        return array.indexOf(elt) > -1;
}

// Pathfinding algorithms
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

function endTurn() {
        if (clientCharacter == currentCharacter && gameState == 'inProgress') {
                socket.emit('nextTurn');
        }
}

function enterRoom() {
	if (hold[currentCharacter].i > -1) {
                // Server Room
                if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[6][4]) <= 0) { 
                        socket.emit('enterRoom', currentCharacter, 'Server Room', 0);       
                // Seminar Room
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[8][4]) <= 0) { 
                        socket.emit('enterRoom', currentCharacter, 'Seminar Room', 1);
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[11][7]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Seminar Room', 1);                        
                // Study Room
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[17][7]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Study Room', 2);                    
                // Convenors Office
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[17][8]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Convenors Office', 4);
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[15][13]) <= 0) { 
                        socket.emit('enterRoom', currentCharacter, 'Convenors Office', 4);
                // Computer Suite
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[19][18]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Computer Suite', 8);
                // Lecture Theatre
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[16][19]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Lecture Theatre', 7);
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[7][19]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Lecture Theatre', 7);                     
                // Admin Office
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[5][18]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Admin Office', 6);
                // Library
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[6][14]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Library', 5);
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[0][11]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Library', 5);
                // Main Hall
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[3][11]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Main Hall', 3);
                } else if (path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[7][8]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Main Hall', 3);
                }
		else {
			alert("You must be by a room door to enter a room");
		}
	}
}

function ready() {
        if (gameState == "notReady") {
                socket.emit('readyGame');
                readyStatus = "READY";
        }
}

function cancel() {
	scenario = ["", "", ""];
	selectingScenario = false;
}

function makeGuess() {
        if (hold[currentCharacter].room = -1) {
                alert("You must be in a room to make a guess");
        }
        else {
                scenarioContext = "guess";
                selectingScenario = true;
        }
}

function makeAccusation() {
        if (hold[currentCharacter].room = -1) {
                alert("You must be in a room to make an accusation");
        }
        else {
                scenarioContext = "accusation";
                selectingScenario = true;
        }
}

function moveUp() {
        if (hold[currentCharacter].i > -1) {
                if ( path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[x][y]) <= rollValue && board[x][y].obstacle == false && currentCharacter == clientCharacter && !movedPeice) {
                        socket.emit('moveItem',currentCharacter, x, y);
                }
        }
}

function moveDown() {
        if (hold[currentCharacter].i > -1) {
                if ( path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[x][y]) <= rollValue && board[x][y].obstacle == false && currentCharacter == clientCharacter && !movedPeice) {
                        socket.emit('moveItem',currentCharacter, x, y);
                }
        }
}

function moveLeft() {
        if (hold[currentCharacter].i > -1) {
                if ( path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[x][y]) <= rollValue && board[x][y].obstacle == false && currentCharacter == clientCharacter && !movedPeice) {
                        socket.emit('moveItem',currentCharacter, x, y);
                }
        }
}

function moveRight() {
        if (hold[currentCharacter].i > -1) {
                if ( path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[x][y]) <= rollValue && board[x][y].obstacle == false && currentCharacter == clientCharacter && !movedPeice) {
                        socket.emit('moveItem',currentCharacter, x, y);
                }
        }
}

