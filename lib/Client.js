class Client{    
    constructor(socket, server){
        this.socket     = socket;
        this._server    = server;
        this.init();
    }

    /**
     * Called when a new Client object is created.
     */
    init(){
        this.socket.on('disconnect', ()=>{ this._server.handleDisconnect(this) });
    }
}
module.exports = Client;