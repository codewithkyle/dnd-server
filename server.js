const express = require('express');
const io = require('socket.io');
const createServer = require('http').createServer;

const Client = require('./lib/Client');

class Server{
    constructor(){
        
        // Server
        this._app       = express();
        this._server    = createServer(this._app);
        this._io        = io(this._server);

        // Sockets
        this._clients   = [];

        this.init();
    }

    init(){
        // Tell the server to listen on the port `8181`
        this._server.listen(5876, ()=>{
            console.log('Server listening on 127.0.0.1:5876');
        });

        // Handle new websocket connections
        this._io.sockets.on('connection', (socket)=>{
            const newSocket = new Client(socket, this);
            this._clients.push(newSocket);
        });
    }

    /**
     * Called when a user disconnects from the server.
     * @param client `Client`
     */
    handleDisconnect(client){
        // Remove the client from the array of clients
        for(let i = 0; i < this._clients.length; i++){
            if(this._clients[i].socket.id === client.socket.id){
                this._clients.splice(i, 1);
            }
        }
	}
}

// Start the server
new Server();