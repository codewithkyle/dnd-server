const express = require('express');
const io = require('socket.io');
const createServer = require('http').createServer;

const Client = require('./lib/Client');
const Room = require('./lib/Room');

class Server{
    constructor(){
        
        // Server
        this.app       = express();
        this.server    = createServer(this.app);
        this.io        = io(this.server);

        // Sockets
        this.clients = [];

        this.rooms = [];

        this.init();
    }

    init(){
        this.server.listen(5876, ()=>{
            console.log('Server listening on port 5876');
        });

        this.io.sockets.on('connection', (socket)=>{
            const client = new Client(socket, this);
            this.clients.push(client);

            socket.on('join', (data) => {
                client.roomUid = data.roomUid;
                client.name = data.name;
                this.handleRoom(data.roomUid, client);
            });

            socket.on('roll', (dice) => {
                this.rollDice(dice, client);
            });

            socket.on('leave', () => {
                this.removeFromRoom(client);
            });
        });
    }

    rollDice(dice, client){
        for (let i = 0; i < this.rooms.length; i++){
            if (client.roomUid === this.rooms[i].uid){
                this.rooms[i].roll(dice, client);
                break;
            }
        }
    }

    handleRoom(roomUid, client){
        let foundRoom = false;
        for (let i = 0; i < this.rooms.length; i++){
            if (roomUid === this.rooms[i].uid){
                foundRoom = true;
                this.rooms[i].addClient(client);
                break;
            }
        }
        if (!foundRoom){
            const newRoom = new Room(roomUid);
            newRoom.addClient(client);
            this.rooms.push(newRoom);
        }
    }

    removeFromRoom(client){
        for (let i = 0; i < this.rooms.length; i++){
            if (client.roomUid === this.rooms[i].uid){
                this.rooms[i].removeClient(client);
                if (this.rooms[i].clients.length === 0){
                    this.rooms.splice(i, 1);
                }
                break;
            }
        }
    }

    /**
     * Called when a user disconnects from the server.
     * @param client `Client`
     */
    handleDisconnect(client){
        // Remove the client from the array of clients
        for(let i = 0; i < this.clients.length; i++){
            if(this.clients[i].socket.id === client.socket.id){
                this.removeFromRoom(client);
                this.clients.splice(i, 1);
                break;
            }
        }
	}
}

// Start the server
new Server();