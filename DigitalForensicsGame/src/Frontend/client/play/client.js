//References
//[1]
/********************************************************************

Author : Tom Kuson
Date : 12/02/2018
Title: cluedo-js
Code version : 1.0.0
Web address : https://github.com/tjkuson/cluedo-js

**********************************************************************/
p5.dom;

//Declarations
//Entire page
var canvas = undefined;
const canvasWidth = 490 + 480 ;
const canvasHeight = 514;
const columns = 24;
const rows = 24;
//Board graphic
var board = new Array(columns);
var gridGraphic = undefined;
const gridWidth = 480;
const gridHeight = 480;
//Character graphic (bar below board)
var characterGraphic = undefined;
const charactersWidth = 480;
const charactersHeight = 24;
//Sidebar graphic
const sidebarWidth = 480;
const sidebarHeight = 480;

//Connect to the socket.io address
var socket = io.connect("localhost:4444");

//Miscellaneous veriables
var characters = 1;
var details = undefined;
var diceSides = 6;
var currentCharacter = 0;
var state = undefined;
var clientCharacter = undefined;
var connections = 1;
var status = "not ready";
var readyClients = 0;
var gotClientDetails = false;
var clientCards = [];
var clientMoved = false;
var makingChoice = false;
var choiceName = undefined;
var choice = ["", "", ""];
var madeChoice = false;

//Define all cards
var suspectCards = ['Student', 'Lecturer', 'Administrator', 'Technician'];
var methodCards = ['Data Theft', 'Fraud', 'Malware', 'Brute Force', 'Man-in-the-middle', 'Phishing'];
var roomCards = ['Server Room', 'Seminar Room', 'Study Room', 'Main Hall', 'Convenors Office', 'Library', 'Admin Office', 'Lecture Theatre', 'Computer Suite'];

var choosingFrom = ["", "", ""];
var choosing = false;

//Define rooms
const roomNum = 9;
var rooms = new Array(roomNum);

//Chat events
window.onload = function(){

	var message = document.getElementById('second');
		handle = document.getElementById('first');
		btn = document.getElementById('send');
		output = document.getElementById('output');

	btn.addEventListener('click', function(){
		socket.emit('chat', {
			message: message.value,
			handle: handle.value
		});
	});
	};

	socket.on('chat', function(data){
		output.innerHTML += '<p><strong>' + data.handle + ': <strong>' + data.message + '</p>';
	});

//Reference[1]. Coordinate, Character and Room functions. Some small changes to variable names and values.

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

        // Show all of the coordinates
        this.show = function() 
        {
                gridGraphic.fill(255,216,101);
                gridGraphic.stroke(0);
                if (this.details == -1) {
                        gridGraphic.strokeWeight(0.5);
                        gridGraphic.rect(this.i * (gridWidth / columns), this.j * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
                } else {
                        details[this.details].show();
                }
        }
		
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
        this.r = red;
        this.g = green;
        this.b = blue;
        this.i = i;
        this.j = j;
        this.room = -1;
        // Show Character
        this.show = function() 
        {
                gridGraphic.fill(this.r, this.g, this.b);
                gridGraphic.noStroke;
                gridGraphic.strokeWeight(0);
                gridGraphic.rect(this.i * (gridWidth / columns), this.j * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
				gridGraphic.fill(0);
				gridGraphic.text(this.name.charAt(0).toUpperCase(), this.i * (gridWidth / columns)+5, this.j * (gridHeight / rows)+15);
        }
}
function Room(name, index, doors, x1, y1, x2, y2)
{
		//Do to - Add more doors
        this.name = name;
        this.index = index;
        this.characters = [];
        this.doors = doors;
        this.doorOne = [x1, y1];
        this.doorTwo = [x2, y2];
        this.enterRoom = function(character) 
        {
                if (this.characters.indexOf(character) == -1) {
                        this.characters.push(character);
                        details[character].room = index;
                        
                        board[details[character].i][details[character].j].details = -1;
                        board[details[character].i][details[character].j].obstacle = false;
                        
                        details[character].i = details[character].j = -1;
                        clientMoved = true;
                        console.log(details[character].name + ' entered room: ' + this.name);
                }
        };
        this.leaveRoom = function(character, i, j)
        {
                arrayRemove(this.characters, character);
                details[character].room = -1;
                details[character].i = i;
                details[character].j = j;
                board[i][j].details = character;
                board[i][j].obstacle = true;
                clientMoved = true;
                console.log(details[character].name + ' left room: ' + this.name);
        }
        this.pathFrom = function(i, j, roll)
        {
                if (doors == 1) {
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
		//Fill room with players
        this.show = function()
        {		
				for (var i = 0; i < details.length; i++) {		
						if (this.name == "Server Room") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((1 + i) * (gridWidth / columns), 2 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};	
						} else if (this.name == "Seminar Room") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((10 + i) * (gridWidth / columns), 2 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};	
						} else if (this.name == "Study Room") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((18 + i) * (gridWidth / columns), 3 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};		
						} else if (this.name == "Main Hall") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((1 + i) * (gridWidth / columns), 8 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};
						} else if (this.name == "Convenors Office") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((18 + i) * (gridWidth / columns), 12 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};
						} else if (this.name == "Library") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((1 + i) * (gridWidth / columns), 14 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};
						} else if (this.name == "Admin Office") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((1 + i) * (gridWidth / columns), 21 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};
						} else if (this.name == "Lecture Theatre") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((10 + i) * (gridWidth / columns), 20 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};
						} else if (this.name == "Computer Suite") {
								if (this.characters.indexOf(i) > -1) {
										gridGraphic.fill(details[i].r, details[i].g, details[i].b);
										gridGraphic.stroke(0);
										gridGraphic.rect((19 + i) * (gridWidth / columns), 21 * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);
								};
						}
				}
        };
}
// Load socket functions
function preload() 
{
        socket.on('newState', function(newState)
        {
                state = newState;
        });

        socket.on('disconnectLog', function()
        {
                window.alert(details[currentCharacter].name + ' has left the game');
        });
		
        socket.emit('gatherStatus');
		
        socket.on('startGame', function(players)
        {
                startGame(players);
                state = 'inProgress';
                socket.emit('getClientCharacter');
        });
		
        socket.on('newCharacter', function(details)
        {
                clientCharacter = details;
                console.log('client character ' + clientCharacter);
                gotClientDetails = true;
                
        });
		
        socket.on('clientMoveCharacter', function(index, x, y)
        {
                // Empty the coordinate
                board[details[index].i][details[index].j].details = -1;
                // Set old coordinate obstacle value to false
                board[details[index].i][details[index].j].obstacle = false;
                // Change the x-pos and y-pos of the character
                details[index].i = x;
                details[index].j = y;
                // Place the character in the new coordinate holding bay
                board[x][y].details = index;
                // Set new coordinate obstacle value to true
                board[x][y].obstacle = true;
                clientMoved = true;
        });
		
        socket.on('updateCurrentCharacter', function(update)
        {
                currentCharacter = update;
                clientMoved = false;
                choice = ["", "", ""];
        });
		
        socket.on('connectionUpdate', function(update)
        {
                connections = update;
        });
		
        socket.on('readyClients', function(update)
        {
                readyClients = update;
        })
		
        socket.on('roll', function(newRoll)
        {
                roll = newRoll;
        });
		
        socket.on('giveCard', function(card)
        {
                clientCards.push(card);
        });
		
        socket.on('accusationCorrect', function()
        {
                window.alert(details[currentCharacter].name + ' wins the game!\nRestart the server to play again!');
        });
		
        socket.on('accusationIncorrect', function()
        {
                window.alert(details[currentCharacter].name + ' is out of the game after a false accusation...');
                makingChoice = false;
        });
		
        socket.on('noCardsFound', function(name, suspect, method, room)
        {
                window.alert(name + " suggested " + suspect + " with " + method + " in " + room + " and found no one with those cards");
        });
		
        socket.on('pickCard', function (name, suspect, method, room)
        {
                window.alert(name + " suggested " + suspect + " with " + method + " in " + room + ", please pick card to show");
                choosingFrom[0] = suspect;
                choosingFrom[1] = method;
                choosingFrom[2] = room;
                choosing = true;
        });
		
        socket.on('showCard', function(card, index)
        {
                window.alert(details[index].name + " shows you card " + card);
        });
		
        socket.on('enterRoom', function(character, roomName, roomIndex)
        {
                rooms[roomIndex].enterRoom(character);
        });
		
        socket.on('leaveRoom', function(roomIndex, character, i, j)
        {
                rooms[roomIndex].leaveRoom(character, i, j);
        });
}

// Setup game    
function setup()
{
        canvas = createCanvas(canvasWidth, canvasHeight);
        gridGraphic = createGraphics(gridWidth, gridHeight);
        characterGraphic = createGraphics(charactersWidth, charactersHeight);
        sideBarGraphic = createGraphics(sidebarWidth, sidebarHeight);
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
        endTurnB.position(400,491);
        endTurnB.mousePressed(endTurn);
        endTurnB.hide();
		//Enter Room button
		enterRoomB = createButton('Enter Room');
        enterRoomB.position(300,491);
        enterRoomB.mousePressed(enterRoom);
        enterRoomB.hide();
		//Cancel button
		cancelB = createButton('Cancel');
        cancelB.position(510, 480);
        cancelB.mousePressed(cancel);
        cancelB.hide();
        //Make accusation and guess buttons
        accusationB = createButton('Make Accusation');
        accusationB.position(510, 400 + clientCards.length * 20 + 20);
        accusationB.mousePressed(makeAccusation);
        accusationB.hide();
        guessB = createButton('Make Guess');
        guessB.position(510, 400 + clientCards.length * 20 + 50);
        guessB.mousePressed(makeGuess);
        guessB.hide();
        quitB = createButton('Quit to main menu');
        quitB.position(28, 524);
        quitB.mousePressed(quit);
        quitB.show();
        // Create Game board
        createBoard();
        console.log("Setup complete")
}

function startGame(players)
{
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
        // (name, index, doors, x1, y1, x2, y2)
        rooms[0] = new Room("Server Room", 0, 1, 6, 4);
        rooms[1] = new Room("Seminar Room", 1, 2, 8, 4, 11, 7);
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
//Reference[1]
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

function draw() 
{
        // Show all coordinates
        for (var i = 0; i < columns; i++) {
                for (var j = 0; j < rows; j++) { 
                        board[i][j].show(); 
                }
        }
        drawBoardDetails();
        gridGraphic.stroke(0);
        gridGraphic.strokeWeight(1);
		
		//Board, rooms and character bar
        if (state == "inProgress") {
				//Hide buttons if its not the clients turn
			    endTurnB.hide();
			    enterRoomB.hide();
                accusationB.hide();
                guessB.hide();
				
                // Highlight the grid if the player can move
                if (10 < mouseX && mouseX < 490 && 10 < mouseY && mouseY< 490 && currentCharacter == clientCharacter && !clientMoved) {
                        if (details[currentCharacter].i > -1) {
                                var x = Math.floor((mouseX-10) / 480 * columns);
                                var y = Math.floor((mouseY-10) / 480 * rows);
                                if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[x][y]) <= roll && board[x][y].obstacle == false) {
                                        gridGraphic.fill(details[currentCharacter].r, details[currentCharacter].g, details[currentCharacter].b, 72);
                                        gridGraphic.rect(x * (gridWidth / columns), y * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);										
                                }
                        } else if (details[currentCharacter].i == -1) {
                                var x = Math.floor((mouseX-10) / 480 * columns);
                                var y = Math.floor((mouseY-10) / 480 * rows);
                                if (rooms[details[currentCharacter].room].pathFrom(x, y, roll) && !board[x][y].obstacle) {
                                        gridGraphic.fill(details[currentCharacter].r, details[currentCharacter].g, details[currentCharacter].b, 72);
                                        gridGraphic.rect(x * (gridWidth / columns), y * (gridHeight / rows), (gridWidth / columns) - 1, (gridHeight / rows) - 1);										
                                }
                        }
                }
				
                // Character bar
                characterGraphic.background(0);
                for (var i = 0; i < characters; i++) {
                        ellipseMode(CENTER);
                        if (i == currentCharacter) {
                                characterGraphic.fill(details[i].r, details[i].g, details[i].b);								
                        } else {
                                characterGraphic.fill(details[i].r, details[i].g, details[i].b, 72);
                        }
                        characterGraphic.ellipse((12 + 24 * i), 12, 20);
						characterGraphic.fill(255);						
						characterGraphic.text(details[i].name.charAt(0).toUpperCase(),(8 + 24 * i), 17);
						
                }
                //Print out whos turn it is
                characterGraphic.fill(255);
                characterGraphic.text(details[currentCharacter].name + "'s turn", 12 + 24 * characters, 18);
				
                // Show buttons if it is clients turn
                if (currentCharacter == clientCharacter) {
                        endTurnB.show();
						enterRoomB.show();
                        accusationB.show();
                        guessB.show();
                }
				
				//Show players in rooms
				for (var i = 0; i < roomNum; i++) {
                        rooms[i].show();
                }
        }
        
        // Side bar
        sideBarGraphic.background(255);
        if (state == "notReady") {
                sideBarGraphic.text(readyClients + ' out of ' + connections + ' players are ready', 30, 30);
                sideBarGraphic.text('More than 1 players are required for the game to start', 30, 50);
                sideBarGraphic.text('Game will start when all players are ready', 30, 70);
                sideBarGraphic.text('Your status: ' + status, 30, 90);
				if (status == "ready")
				{
					readyB.hide()
				}
				else {
					readyB.show();
				}
        }
		
		//Client actions
        if (state == "inProgress" && gotClientDetails) {
        		//To-do
                /*
                buttonUp.show();
                buttonDown.show();
                buttonLeft.show();
                buttonRight.show();
                */
				//Hide buttons from lobby screen
                readyB.hide();
				cancelB.hide();
                if (makingChoice) {
						accusationB.hide();
						guessB.hide();
						cancelB.show();
                        sideBarGraphic.text('Making accusation/guess with room: ' + rooms[details[currentCharacter].room].name, 30, 30);
                        sideBarGraphic.text('Select a suspect and a method:', 30, 50);
                        if (choice[0].length < 1) {
                                // List suspects
                                for (var i = 0; i < suspectCards.length; i++) {
                                        sideBarGraphic.text(suspectCards[i], 60, 70 + 20*i);
                                }
                        } else if (choice[1].length < 1) {
                                // List methods
                                for (var i = 0; i < methodCards.length; i++) {
                                        sideBarGraphic.text(methodCards[i], 60, 70 + 20*i);
                                }
                        }
                } else if (choosing) {
                        sideBarGraphic.text('Pick a card to show ' + details[currentCharacter].name, 30, 30);
                        for (var i = 0; i < choosingFrom.length; i++) {
                                sideBarGraphic.text(choosingFrom[i], 50, 50 + 20 * i);
                        }
                        
                } else {
                        sideBarGraphic.text('Your character is ' + details[clientCharacter].name, 30, 30);
                        if (clientCharacter == currentCharacter) {
                                sideBarGraphic.text('You rolled ' + roll, 30, 50);
                        } else {
                                sideBarGraphic.text(details[currentCharacter].name + ' rolled ' + roll, 30, 50);
                        }
                        sideBarGraphic.text('Cards in your hand:', 30, 70);
                        for (var i = 0; i < clientCards.length; i++) {
                                sideBarGraphic.text(clientCards[i], 50, 90 + i*20);
                        }
                }
        }
		
		//Scale correctly
        copy(gridGraphic, 0, 0, 480, 480, 10, 10, 480, 480);
        copy(characterGraphic, 0, 0, 480, 24, 10, 490, 480, 24);
        copy(sideBarGraphic, 0, 0, 480, 480, 490, 10, 480, 480);
}

function drawBoardDetails() 
{
	
        // Server Room
        gridGraphic.fill(0, 0, 0);
        gridGraphic.strokeWeight(1);
        gridGraphic.line(7*20 -1, 0 -1, 7*20 -1, 4*20 -1);
        gridGraphic.line(0 -1, 4*20 -1, 7*20 -1, 4*20 -1);
        gridGraphic.fill(239,176,184);
        gridGraphic.rect(0 -1, 0 -1, 7*20 -1, 4*20 -1);
        // Seminar Room
        gridGraphic.fill(0, 0, 0);
        gridGraphic.line(9*20 , 0 , 9*20 , 7*20 - 1);
        gridGraphic.line(15*20-1, 0 , 15*20-1, 7*20 - 1);
        gridGraphic.line(9*20 - 1, 7*20 - 2, 15*20 - 1, 7*20 - 2);
        gridGraphic.fill(254,242,202);
        gridGraphic.rect( 9*20  , 0 - 1, 6*20 - 2, 7*20 - 1);
        // Study Room
        gridGraphic.fill(0, 0, 0);
        gridGraphic.line(17*20, 0, 17*20, 7*20 -1);
        gridGraphic.line(336, 120-1, 480, 120-1);
        gridGraphic.fill(227,239,217);
        gridGraphic.rect(17*20, 0 -1, 7*20 -1, 7*20-1);
        // Middle
        gridGraphic.stroke(0);
        gridGraphic.line(190,160,280,160);
        gridGraphic.line(280,160,280,300);
        gridGraphic.line(280,300,180,300);
        gridGraphic.line(180,300,180,160);      
        gridGraphic.fill(179,198,231);
        gridGraphic.rect(9*20 , 8*20, 5*20-1, 7*20-1);
        gridGraphic.strokeWeight(1);
        // Main Hall
        gridGraphic.fill(0,0,0);
        gridGraphic.line(0, 120, 120 - 1, 120);
        gridGraphic.line(120 -2, 120, 120 -2, 7*20);
        gridGraphic.line(120 -1, 7*20, 7*20-1, 7*20);
        gridGraphic.line(7*20-2, 7*20, 7*20-2, 200 -1);
        gridGraphic.line(7*20 -2, 200-2, 120-2, 200-2);
        gridGraphic.line(120-2, 200-2, 120-2, 220-2);
        gridGraphic.line(0 -1, 220-2, 120-1, 220-2);
        gridGraphic.fill(222,234,246);
        gridGraphic.rect(-1, 120, 120-1, 100 -2);
        gridGraphic.stroke(222,234,246);
        gridGraphic.rect(120-3, 140+1, 20, 60-4);
        // Convenors Office
        gridGraphic.fill(0);
        gridGraphic.stroke(0);
        gridGraphic.line(320, 180, 480, 180);
        gridGraphic.line(320, 180, 320, 320);
        gridGraphic.line(320, 320, 400, 320);
        gridGraphic.line(400, 320, 400, 340);
        gridGraphic.line(400, 340, 480, 340);      
        gridGraphic.fill(240,192,240);
        gridGraphic.stroke(240,192,240);
        gridGraphic.rect(320+1, 180+1, 80-2, 140-3);
        gridGraphic.stroke(240,192,240);
        gridGraphic.rect(400+1, 180+1, 80-3, 160-3);
        gridGraphic.rect(330, 190, 140, 120);
        // Library
        gridGraphic.fill(0);
        gridGraphic.stroke(0);
        gridGraphic.line(0, 240, 120 -1, 240);
        gridGraphic.line(120 -2, 240, 120-2, 340 -1);
        gridGraphic.line(0, 340 -2, 120 -2, 340 -2);
        gridGraphic.fill(243,203,238);
        gridGraphic.rect(0 -1, 240, 120 -1, 100 -2);
        // Admin Office
        gridGraphic.fill(0);
        gridGraphic.stroke(0);
        gridGraphic.line(0, 380, 120, 380);
        gridGraphic.line(120, 380, 120, 380+(20*6));
        gridGraphic.fill(251,227,215);
        gridGraphic.stroke(255);
        gridGraphic.rect(0, 380+1, 120 -2, 100 -3);
        // Lecture theatre
        gridGraphic.fill(0);
        gridGraphic.stroke(0);
        gridGraphic.line(160-2, 340, 160+(8*20) -1, 340);
        gridGraphic.line(160 -2, 340, 160-2, 340+(7*20));
        gridGraphic.line(320 -2, 340, 320-2, 340+(7*20));
        gridGraphic.fill(240,185,182);
        gridGraphic.rect(160, 340, 160-2, 140 -1);
        // Computer Suite
        gridGraphic.fill(0);
        gridGraphic.line(360, 380, 480, 380);
        gridGraphic.line(360, 380, 360, 480);
        gridGraphic.fill(216,216,216);
        gridGraphic.rect(360, 380, 120-1, 100 -1);
        // Text
        gridGraphic.noFill(255);
        gridGraphic.noStroke();
        gridGraphic.textSize(12);
        gridGraphic.stroke(0);
        gridGraphic.text("Server Room", 10, 20);
        gridGraphic.text("Seminar Room", 200, 20);
        gridGraphic.text("Study Room", 380, 20);
        gridGraphic.text("Main Hall", 10, 140);
        gridGraphic.text("Convenors Office", 380, 210);
        gridGraphic.text("Library", 10, 265);
        gridGraphic.text("Admin Office", 10, 410);
        gridGraphic.text("Lecture Theatre", 200, 360);
        gridGraphic.text("Computer Suite", 375, 410);
        // Doors
        gridGraphic.stroke(255,216,101);
        gridGraphic.strokeWeight(4);
        //server room door 1
        gridGraphic.line(6*20 , 4*20 , 7*20 , 4*20 );
        //main hall door 1
        gridGraphic.line(7*20 , 8*20, 7*20, 9*20 );
        //main hall door 2
        gridGraphic.line(3*20 , 11*20, 4*20 , 11*20 );
        //library door 1
        gridGraphic.line(0*20 , 12*20, 1*20 , 12*20 );
		//library door 2
        gridGraphic.line(6*20 , 14*20, 6*20, 15*20 );
		//admin office door 1
        gridGraphic.line(5*20 , 19*20, 6*20 , 19*20 );
		//lecture Theatre door 1
        gridGraphic.line(8*20 , 19*20, 8*20, 20*20 );
        //To do - doors 2 and 3 are not possible - max 2 doors currently
        //lecture theatre door 2
        //gridGraphic.line(10*20 , 17*20, 11*20, 17*20 );
		//lecture theatre door 3        
        //gridGraphic.line(13*20 , 17*20, 14*20, 17*20 );
		//lecture theatre door 4
        gridGraphic.line(16*20 , 19*20, 16*20, 20*20 );
		//computer suite door 1
        gridGraphic.line(19*20 , 19*20, 20*20, 19*20 );
		//convenors office door 1		
        gridGraphic.line(16*20 , 13*20, 16*20, 14*20 );
		//convenors office door 2
        gridGraphic.line(17*20 , 9*20, 18*20, 9*20 );
        //study room door 1
        gridGraphic.line(17*20 , 7*20, 18*20, 7*20 );
        //seminar room door 1
        gridGraphic.line(11*20 , 7*20, 12*20, 7*20 );
		//seminar room door 2
        gridGraphic.line(9*20 , 4*20, 9*20, 5*20 );
		
		gridGraphic.stroke(0, 0, 0);
		gridGraphic.strokeWeight(4);
		gridGraphic.line(0, 0, 480, 0);
		gridGraphic.line(480, 0, 480, 480);
		gridGraphic.line(480, 480, 0, 480);
		gridGraphic.line(0, 480, 0, 0);
}

//Mouse click functions, used instead of buttons for moving on the board and selecting cards
//Reference[1] - Updated for our new board design
function mouseClicked() 
{
		//Movement on board
        if (10 < mouseX && mouseX < 490 && mouseY > 10 && mouseY < 490) {
			// Calculate the x-pos and y-pos of the mouse with respect to the grid
			var x = Math.floor((mouseX-10) / 480 * columns);
			var y = Math.floor((mouseY-10) / 480 * rows);
			// If path short enough with respect to roll value and destination not an obstacle, move character & if not in room
			if (details[currentCharacter].i > -1) {
				if ( path(board[details[currentCharacter].i][details[currentCharacter].j] , board[x][y]) <= roll && board[x][y].obstacle == false && currentCharacter == clientCharacter && !clientMoved) {
					socket.emit('moveCharacter',currentCharacter, x, y);
				}
			}
			if (details[currentCharacter].i == -1) {
				var roomIndex = details[currentCharacter].room;
				if(rooms[roomIndex].pathFrom(x, y, roll)) {
					socket.emit('leaveRoom', currentCharacter, roomIndex, x, y);
				}
			}
                        if (clientMoved){
                                alert("You have already moved!");
                        }

        // Side bar 
		// Picking cards to show
        } else if (choosing) {
                if (mouseX > 550 && mouseX < 710 && mouseY > 45 && mouseY < choosingFrom.length * 20 + 45) {
                        var index = Math.floor((mouseY - 45)/20);
                        if (arrayContains(clientCards, choosingFrom[index])) {
                                socket.emit('pickedCard', choosingFrom[index]);
                                choosing = false;
                                choosingFrom = ["", "", ""];
                        }
                }
		// Picking cards for an accusation or a guess
        } else if (makingChoice) {
                // Choose cards
                if (choice[0].length < 1) {
                        // Chosing a suspect
                        if (mouseX > 550 && mouseX < 710 && mouseY > 65 && mouseY < suspectCards.length * 20 + 65) {
                                var index = Math.floor((mouseY - 65)/20);
                                choice[0] = suspectCards[index];
                        }
                } else if (choice[1].length < 1) {
                        // Chosing a method
                        if (mouseX > 550 && mouseX < 710 && mouseY > 65 && mouseY < methodCards.length * 20 + 65) {
                                var index = Math.floor((mouseY - 65)/20);
                                choice[1] = methodCards[index];
                                // Select room from the room player is in
                                choice[2] = rooms[details[currentCharacter].room].name;
                                if (choiceName == "accusation") {
                                        socket.emit('makeAccusation', choice[0], choice[1], choice[2]);
										madeChoice = true;
                                } else if (choiceName == "guess") {
                                        socket.emit("makeGuess", choice[0], choice[1], choice[2]);
                                        makingChoice = false;
										madeChoice = true;
                                }
                        }
                }
        }
}

function arrayContains(array, element) 
{
        return array.indexOf(element) > -1;
}

// Pathfinding algorithm
//Reference[1]
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

function arrayRemove(array, item) 
{
        for (var i = array.length - 1; i >= 0; i--) {
                if (array[i] == item) {
                        array.splice(i, 1);
                }
        }
}

//End turn button function
function endTurn() {
        if (clientCharacter == currentCharacter && state == 'inProgress') {
                madeChoice = false;
                makingChoice = false;
				socket.emit('nextTurn');
        }
}

//Enter room button function
function enterRoom() {
	if (details[currentCharacter].i > -1) {
				if (clientMoved) {
						alert("You have already moved!");
                // Server Room
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[6][4]) <= 0) { 
                        socket.emit('enterRoom', currentCharacter, 'Server Room', 0);
                // Seminar Room
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[8][4]) <= 0) { 
                        socket.emit('enterRoom', currentCharacter, 'Seminar Room', 1);
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[11][7]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Seminar Room', 1);                        
                // Study Room
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[17][7]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Study Room', 2);                    
                // Convenors Office
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[17][8]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Convenors Office', 4);
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[15][13]) <= 0) { 
                        socket.emit('enterRoom', currentCharacter, 'Convenors Office', 4);
                // Computer Suite
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[19][18]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Computer Suite', 8);
                // Lecture Theatre
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[16][19]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Lecture Theatre', 7);
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[7][19]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Lecture Theatre', 7);                     
                // Admin Office
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[5][18]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Admin Office', 6);
                // Library
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[6][14]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Library', 5);
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[0][11]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Library', 5);
                // Main Hall
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[3][11]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Main Hall', 3);
                } else if (path(board[details[currentCharacter].i][details[currentCharacter].j] , board[7][8]) <= 0) {
                        socket.emit('enterRoom', currentCharacter, 'Main Hall', 3);
                } else if (!clientMoved){
                        alert("You must be by a room door to enter a room");
                }
	}
    else if (details[currentCharacter].room > -1) {
            alert("You are already in a room!");
    }
}

//Lobby screen ready button function
function ready() {
        if (state == "notReady") {
                socket.emit('readyGame');
                status = "ready";
        }
}

//Cancel button function to stop making an accusation or a guess
function cancel() {
	choice = ["", "", ""];
	makingChoice = false;
}

//Make guess button function
function makeGuess() {
        if (details[currentCharacter].room == -1) {
                alert("You must be in a room to make a guess");
        }
        else if (!madeChoice){
                choiceName = "guess";
                makingChoice = true;
        }
		else {
			alert("You can only make one accusation/guess a turn");
		}
}

//Make accusation button function
function makeAccusation() {
        if (details[currentCharacter].room == -1) {
                alert("You must be in a room to make an accusation");
        }
        else if(!madeChoice) {
                choiceName = "accusation";
                makingChoice = true;
        }
		else {
			alert("You can only make one accusation/guess a turn");
		}
}

function quit() {
       if (currentCharacter!=clientCharacter && state == "inProgress") {
                alert("It must be your turn for you to quit");
        }
        else {
                window.location = "http://localhost:4444/";
        }
}

//To do - Functions for movement arrow keys
/*
function moveUp() {
        if (details[currentCharacter].i > -1) {
                if ( path(board[details[currentCharacter].i][details[currentCharacter].j] , board[x][y]) <= roll && board[x][y].obstacle == false && currentCharacter == clientCharacter && !clientMoved) {
                        socket.emit('moveCharacter',currentCharacter, x, y);
                }
        }
}

function moveDown() {
        if (details[currentCharacter].i > -1) {
                if ( path(board[details[currentCharacter].i][details[currentCharacter].j] , board[x][y]) <= roll && board[x][y].obstacle == false && currentCharacter == clientCharacter && !clientMoved) {
                        socket.emit('moveCharacter',currentCharacter, x, y);
                }
        }
}

function moveLeft() {
        if (details[currentCharacter].i > -1) {
                if ( path(board[details[currentCharacter].i][details[currentCharacter].j] , board[x][y]) <= roll && board[x][y].obstacle == false && currentCharacter == clientCharacter && !clientMoved) {
                        socket.emit('moveCharacter',currentCharacter, x, y);
                }
        }
}

function moveRight() {
        if (details[currentCharacter].i > -1) {
                if ( path(board[details[currentCharacter].i][details[currentCharacter].j] , board[x][y]) <= roll && board[x][y].obstacle == false && currentCharacter == clientCharacter && !clientMoved) {
                        socket.emit('moveCharacter',currentCharacter, x, y);
                }
        }
}
*/