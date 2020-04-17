class Client{    
    constructor(socket, server){
        this.socket     = socket;
        this._server    = server;
        this.uid        = socket.id;
        this.roomUid    = null;
        this.name       = null;
        this.characterUid = null;
        this.init();
        this.ticks = 0;
    }

    tick(){
        this.ticks++;
        if (this.ticks >= 100){
            this.ticks = 0;
        }
    }

    send(message, data){
        this.socket.emit(message, data);
    }

    /**
     * Called when a new Client object is created.
     */
    init(){
        this.socket.on('disconnect', ()=>{ this._server.handleDisconnect(this) });
    }
}
module.exports = Client;