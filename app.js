const express = require('express');
const io = require('socket.io');
const createServer = require('http').createServer;
const createSecureServer = require('https').createServer;

const Client = require('./lib/Client');
const Room = require('./lib/Room');

class Server{
    constructor(options = null){
        this.app = express();
        if (options){
            this.debug = false;
            this.server = createSecureServer(options, this.app);
        }else{
            this.debug = true;
            this.server = createServer(this.app);
        }
        this.io = io(this.server, {
            pingInterval: 120000,
            pingTimeout: 90000,
        });
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
                client.characterUid = data.characterUid;
                this.handleRoom(data.roomUid, client);
            });

            socket.on('roll', (dice) => {
                this.rollDice(dice, client);
            });

            socket.on('leave', () => {
                this.removeFromRoom(client);
            });

            socket.on("ping-player", (characterUid) => {
                if (this.debug){
                    console.log(`Recieved a ping command for ${characterUid}`);
                }
                const room = this.getRoom(client.roomUid);
                room.pingPlayer(characterUid);
            });

            socket.on('initiation-order', (order) => {
                const room = this.getRoom(client.roomUid);
                room.setInitiationOrder(order);
            });

            socket.on("ping-from-npc", (name) => {
                if (this.debug){
                    console.log(`Recieved a ping command for ${name}`);
                }
                const room = this.getRoom(client.roomUid);
                room.handleNPCPing(name);
            });

            socket.on('clear-order', () => {
                const room = this.getRoom(client.roomUid);
                room.clearInitiationOrder();
            });

            socket.on('heartbeat', () => {
                if (this.debug){
                    console.log(`${client.name} is still alive`);
                }
            });
        });
    }

    getRoom(roomUid){
        for (let i = 0; i < this.rooms.length; i++){
            if (roomUid === this.rooms[i].uid){
                return this.rooms[i];
            }
        }
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
            const newRoom = new Room(roomUid, this.debug);
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
module.exports = Server;