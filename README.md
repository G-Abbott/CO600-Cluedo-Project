C0600 Group Project - Digital Forensics Detective

By George Abbott (gaa21), Lewis Sainsbury (lds29), Tom Griffin (tg252) and Shay Ritchie (sr574).

Our game is a recreation of the original game of Cluedo base off of Kent University and with a digital forensics twist.

For a base we used an existing version of a Javascript cluedo game from this git repository by Tom Kuson, made in Feburary 2018

/********************************************************************
- Author : Tom Kuson
- Date : 12/02/2018
- Title: cluedo-js
- Code version : 1.0.0
- Web address : https://github.com/tjkuson/cluedo-js

**********************************************************************/

This gave us a basic layout and game board to work from however it lacked the features that we wanted and it contained various bugs and issues.

/**************Running the Server********************/

The application is currently set to run off of raptor, this allows for multiplayer access from any device.

To start the server locate to this address:

\proj\co600\project\c06_digifor\public_html\DigitalForensicsGame\src\Frontend

Open the frontend folder in command line and type 'node server'

To play, navigate within any browser to the address: 

http://raptor.kent.ac.uk/proj/co600/project/c06_digifor/DigitalForensicsGame/src/Frontend/client/index.html

Any issues or to restart the game, please exit from the command line turn off the server with the command 'killall node'.