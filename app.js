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
                client.name = data.name;
                client.characterUid = data.characterUid;
                this.handleRoom(data.roomUid, client);
            });

            socket.on('roll', (dice) => {
                if (client.room){
                    client.room.roll(dice, client);
                }
            });

            socket.on('leave', () => {
                this.removeFromRoom(client);
            });

            socket.on("combat-order-update", (uid) => {
                if (client.room){
                    client.room.updateCombatOrder(uid);
                }
            });

            socket.on('initiation-order', (order) => {
                if (client.room){
                    client.room.setInitiationOrder(order);
                }
            });

            socket.on('clear-order', () => {
                if (client.room){
                    client.room.clearInitiationOrder();
                }
            });

            socket.on('heartbeat', () => {
                client.tick();
            });

            socket.on('load-map', (url) => {
                if (client.room){
                    client.room.loadMap(url);
                }
            });

            socket.on('update-position', (data) => {
                if (client.room){
                    client.room.updatePosition(data);
                }
            });

            socket.on('init-map', () => {
                if (client.room){
                    client.room.initUserMap(client);
                }
            });

            socket.on('ping-pos', (pos) => {
                if (client.room){
                    client.room.pingPos(pos, client.uid);
                }
            });

            socket.on('place-pin', (data) => {
                if (client.room){
                    client.room.placePin(data);
                }
            });

            socket.on('add-entity', (data) => {
                if (client.room){
                    client.room.addEntity(data);
                }
            });

            socket.on('remove-pin', (uid) => {
                if (client.room){
                    client.room.removePin(uid);
                }
            });

            socket.on('remove-entity', (uid) => {
                if (client.room){
                    client.room.removeEntity(uid);
                }
            });

            socket.on('render-drawing', (drawing) => {
                if (client.room){
                    client.room.renderDynamicMap(drawing, client.uid);
                }
            });

            socket.on('clear-drawing', () => {
                if (client.room){
                    client.room.clearDynamicMap(client.uid);
                }
            });

            socket.on('toggle-player-input', (allowPlayers) => {
                if (client.room) {
                    client.room.togglePlayerInput(allowPlayers);
                }
            });

            socket.on('init-combat-order', () => {
                if (client.room){
                    client.room.initCombatOrder(client);
                }
            });
            
            socket.on('update-entity', (data) => {
                if (client.room){
                    client.room.updateEntity(data);
                }
            });
        });
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
        client.room.removeClient(client);
        for (let i = this.rooms.length - 1; i >= 0; i--){
            if (this.rooms[i].clients.length === 0){
                this.rooms.splice(i, 1);
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