p5.dom;

// Declaring variables & constants & objects
var canvas = undefined;
const CANVAS_WIDTH = 480 + 480 ;
const CANVAS_HEIGHT = 504;
const COLS = 20;
const ROWS = 20;
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
                gridGraphics.fill(255);
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
                                gridGraphics.rect(3 * (GRID_WIDTH / COLS), 7 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Convenors Office") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(18 * (GRID_WIDTH / COLS), 10 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Library") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(3 * (GRID_WIDTH / COLS), 13 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Admin Office") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(10 * (GRID_WIDTH / COLS), 18 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Lecture Theatre") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(18 * (GRID_WIDTH / COLS), 18 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
                        };
                } else if (this.name == "Computer Suite") {
                        if (this.characters.indexOf(currentCharacter) > -1) {
                                gridGraphics.fill(hold[currentCharacter].r, hold[currentCharacter].g, hold[currentCharacter].b);
                                gridGraphics.stroke(0);
                                gridGraphics.rect(3 * (GRID_WIDTH / COLS), 18 * (GRID_HEIGHT / ROWS), (GRID_WIDTH / COLS) - 1, (GRID_HEIGHT / ROWS) - 1);
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
        //Arrow buttons
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
        //End turn button
        endTurnB = createButton('End Turn');
        endTurnB.position(400,480);
        endTurnB.mousePressed(endTurn);
        endTurnB.hide();
        //Make accusation and guess buttons
        accusationB = createButton('Make Accusation');
        accusationB.position(30, 110 + clientHand.length * 20 + 20);
        accusationB.mousePressed(makeAccusation);
        accusationB.hide();
        guessB = createButton('Make Guess');
        guessB.position(30, 110 + clientHand.length * 20 + 40);
        guessB.mousePressed(makeGuess);
        guessB.hide();
        // Generate board
        generateBoard();
        console.log("Setup complete")
}
function startGame(players)
{
        characters = players;
        hold = new Array(characters);
        if (players > 0) {
                hold[0] = new Item("character", "Student", 0, 255, 0, 6, 0);
                board[6][0].hold = 0;
                board[6][0].obstacle = true;    
        } if (players > 1) {
                hold[1] = new Item("character", "Lecturer", 255, 36, 0, 12, 0);
                board[12][0].hold = 1;
                board[12][0].obstacle = true;
        } if (players > 2) {
                hold[2] = new Item("character", "Administrator", 9, 84, 190, 6, 19);
                board[6][19].hold = 2;
                board[6][19].obstacle = true;
        } if (players > 3) {
                hold[2] = new Item("character", "Technician", 162, 0, 204, 14, 19);
                board[14][19].hold = 3;
                board[14][19].obstacle = true;
        }
        // (name, index, doors, x1, y1, x2, y2)
        rooms[0] = new Room("Server Room", 0, 1, 5, 3);
        rooms[1] = new Room("Seminar room", 1, 2, 9, 6, 12, 4);
        rooms[2] = new Room("Study Room", 2, 1, 14, 5);
        rooms[3] = new Room("Main Hall", 3, 2, 6, 7, 1, 10);
        rooms[4] = new Room("Convenors Office", 4, 2, 16, 7, 13, 9);
        rooms[5] = new Room("Library", 5, 2, 2, 10, 6, 13);
        rooms[6] = new Room("Admin Office", 6, 2, 11, 13, 14, 15);
        rooms[7] = new Room("Lecture Theatre", 7, 1, 17, 14);
        rooms[8] = new Room("Computer Suite", 8, 1, 5, 17);
}
function generateBoard() 
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
                buttonUp.show();
                buttonDown.show();
                buttonLeft.show();
                buttonRight.show();
                readyB.hide();
                if (selectingScenario) {
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
                        majorMiscGraphics.text('Game started with ' + characters + ' number of players', 30, 30);
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
                        guessB.hide();
                        scenarioContext = "accusation";
                        selectingScenario = true;
                }
                }
        }
        // Draw rooms
        if (gameState == "inProgress") {
                for (var i = 0; i < ROOM_CONST; i++) {
                        rooms[i].show();
                }
        };
        copy(gridGraphics, 0, 0, 480, 480, 0, 0, 480, 480);
        copy(charactersGraphics, 0, 0, 480, 24, 0, 480, 480, 24);
        copy(majorMiscGraphics, 0, 0, 480, 480, 480, 0, 480, 480);
}
function drawBoardDetails() 
{
        // Server Room
        gridGraphics.fill(0, 0, 0);
        gridGraphics.strokeWeight(1);
        gridGraphics.line(144 -1, 0 -1, 144 -1, 72 -1);
        gridGraphics.line(0 -1, 72 -1, 144 -1, 72 -1);
        gridGraphics.fill(255);
        gridGraphics.rect(0 -1, 0 -1, 144 -1, 72 -1);
        // Seminar Room
        gridGraphics.fill(0, 0, 0);
        gridGraphics.line(192 , 0 , 192 , 144 - 1);
        gridGraphics.line(288-1, 0 , 288-1, 144 - 1);
        gridGraphics.line(192 - 1, 144 - 2, 288 - 1, 144 - 2);
        gridGraphics.fill(255);
        gridGraphics.rect( 192  , 0 - 1, 96 - 2, 144 - 1);
        // Study Room
        gridGraphics.fill(0, 0, 0);
        gridGraphics.line(336, 0, 336, 120 -1);
        gridGraphics.line(336, 120-1, 480, 120-1);
        gridGraphics.fill(255);
        gridGraphics.rect(336, 0 -1, 144 -1, 120-1);
        // Middle
        gridGraphics.fill(85,107,47);
        gridGraphics.rect(192 -1, 168-1, 96, 120);
        gridGraphics.strokeWeight(1);
        // Convenors Office
        gridGraphics.fill(0,0,0);
        gridGraphics.line(0, 120, 120 - 1, 120);
        gridGraphics.line(120 -2, 120, 120 -2, 144);
        gridGraphics.line(120 -1, 144, 144-1, 144);
        gridGraphics.line(144-2, 144, 144-2, 216 -1);
        gridGraphics.line(144 -2, 216-2, 120-2, 216-2);
        gridGraphics.line(120-2, 216-2, 120-2, 240-2);
        gridGraphics.line(0 -1, 240-2, 120-1, 240-2);
        gridGraphics.fill(255);
        gridGraphics.rect(-1, 120, 120-1, 120 -2);
        gridGraphics.stroke(255);
        gridGraphics.rect(120-3, 144+1, 24, 72-4);
        // Computer Suite
        gridGraphics.fill(0);
        gridGraphics.stroke(0);
        gridGraphics.line(336, 192, 480, 192);
        gridGraphics.line(336, 192, 336, 288 -1);
        gridGraphics.line(336, 288 -2, 480, 288 -2);
        gridGraphics.fill(255);
        gridGraphics.rect(336, 192, 144 -1, 96 -2);
        // Lecutre Theater
        gridGraphics.fill(0);
        gridGraphics.line(0, 264, 144 -1, 264);
        gridGraphics.line(144 -2, 264, 144-2, 360 -1);
        gridGraphics.line(0, 360 -2, 144 -2, 360 -2);
        gridGraphics.fill(255);
        gridGraphics.rect(0 -1, 264, 144 -1, 96 -2);
        // Admin Office
        gridGraphics.fill(0);
        gridGraphics.line(0, 408, 120, 408);
        gridGraphics.line(120, 408, 120, 432);
        gridGraphics.line(120, 432, 144 -1, 432);
        gridGraphics.line(144 -2, 432, 144 -2, 480);
        gridGraphics.fill(255);
        gridGraphics.stroke(255);
        gridGraphics.rect(0, 408+1, 120 -2, 72 -3);
        gridGraphics.rect(120 -2, 432 +1 , 24 -1, 48 -3);
        // Library
        gridGraphics.fill(0);
        gridGraphics.stroke(0);
        gridGraphics.line(192, 360, 312 -1, 360);
        gridGraphics.line(312 -2, 360, 312 -2, 480);
        gridGraphics.line(192, 360, 192, 480);
        gridGraphics.fill(255);
        gridGraphics.rect(192, 336, 144 -2, 144 -1);
        // Main Hall
        gridGraphics.fill(0);
        gridGraphics.line(384, 360, 480, 360);
        gridGraphics.line(384, 360, 384, 480);
        gridGraphics.fill(255);
        gridGraphics.rect(384, 360, 96 -1, 120 -1);
        // Text
        gridGraphics.noFill(255);
        gridGraphics.noStroke();
        gridGraphics.textSize(12);
        gridGraphics.stroke(0);
        gridGraphics.text("Server Room", 10, 20);
        gridGraphics.text("Seminar Room", 200, 20);
        gridGraphics.text("Study Room", 420, 20);
        gridGraphics.text("Main Hall", 10, 140);
        gridGraphics.text("Convenors Office", 400, 210);
        gridGraphics.text("Library", 10, 280);
        gridGraphics.text("Admin Office", 10, 425);
        gridGraphics.text("Lecture Theatre", 200, 360);
        gridGraphics.text("Computer Suite", 400, 380);
        // Doors
        gridGraphics.stroke(255, 255, 255);
        gridGraphics.strokeWeight(4);
        gridGraphics.line(120 +2, 72 -1, 144 -2, 72 -1);
        gridGraphics.line(216, 144 -1, 240, 144 -1);
        gridGraphics.line(288 -1, 96, 288 -1, 120);
        gridGraphics.line(336, 120, 360, 120);
        gridGraphics.line(384, 192, 408, 192);
        gridGraphics.line(336, 216, 336, 240);
        gridGraphics.line(144, 168, 144, 192);
        gridGraphics.line(24, 240, 48, 240);
        gridGraphics.line(48, 264, 72, 264);
        gridGraphics.line(144, 312, 144, 336);
        gridGraphics.line(120, 432, 144, 432);
        gridGraphics.line(264, 336, 288, 336);
        gridGraphics.line(336, 360, 336, 384);
        gridGraphics.line(408, 360, 432, 360);
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
                        // Study
                        } else if (( x == 5 && y == 2) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[5][3]) <= rollValue - 1) { 
                                socket.emit('enterRoom', currentCharacter, 'Server Room', 0);
                        // Hall one
                        } else if (( x == 9 && y == 5) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[9][6]) <= rollValue - 1) { 
                                socket.emit('enterRoom', currentCharacter, 'Seminar Room', 1);
                        } else if (( x == 11 && y == 4) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[12][4]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Seminar Room', 1);
                        // Lounge
                        } else if (( x == 14 && y == 4) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[14][5]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Study Room', 2);
                        // Library
                        } else if (( x == 5 && y == 7) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[6][7]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Main Hall', 3);
                        } else if (( x == 1 && y == 9) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[1][10]) <= rollValue - 1) { 
                                socket.emit('enterRoom', currentCharacter, 'Main Hall', 3);
                        // Dining room
                        } else if (( x == 16 && y == 8) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[16][7]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Convenors Office', 4);
                        } else if (( x == 14 && y == 9) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[13][9]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Convenors Office', 4);
                        // Billiard room
                        } else if (( x == 2 && y == 11) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[2][10]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Library', 5);
                        } else if (( x == 6 && y == 12) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[6][13]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Library', 5);
                        // Ballroom
                        } else if (( x == 11 && y == 14) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[11][13]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Admin Office', 6);
                        } else if (( x == 13 && y == 15) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[14][15]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Admin Office', 6);
                        // Kitchen
                        } else if (( x == 17 && y == 15) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[17][14]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Lecture Theatre', 7);
                        // Conservatory
                        } else if (( x == 5 && y == 18) && path(board[hold[currentCharacter].i][hold[currentCharacter].j] , board[5][17]) <= rollValue - 1) {
                                socket.emit('enterRoom', currentCharacter, 'Computer Suite', 8);
                        }
                } else if (hold[currentCharacter].i == -1) {
                        var roomIndex = hold[currentCharacter].room;
                        if(rooms[roomIndex].pathFrom(x, y, rollValue -1)) {
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

function ready() {
        if (gameState == "notReady") {
                socket.emit('readyGame');
                readyStatus = "READY";
        }
}

function makeGuess() {
        scenarioContext = "accusation";
        selectingScenario = true;
}

function makeAccusation() {
        scenarioContext = "accusation";
        selectingScenario = true;
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