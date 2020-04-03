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

            socket.on('join', (roomUid) => {
                client.roomUid = roomUid;
                this.handleRoom(roomUid, client.uid);
            });
        });
    }

    handleRoom(roomUid, clientUid){
        let foundRoom = false;
        for (let i = 0; i < this.rooms.length; i++){
            if (roomUid === this.rooms[i].uid){
                foundRoom = true;
                this.rooms[i].addClient(clientUid);
                break;
            }
        }
        if (!foundRoom){
            const newRoom = new Room(roomUid);
            newRoom.addClient(clientUid);
        }
    }

    removeFromRoom(client){
        for (let i = 0; i < this.rooms.length; i++){
            if (client.roomUid === this.rooms[i].uid){
                this.rooms[i].removeClient(clientUid);
                if (!this.rooms[i].clients.length){
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
                this.removeFromRoom(clients[i]);
                this.clients.splice(i, 1);
            }
        }
	}
}

// Start the server
new Server();