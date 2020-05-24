const { DiceRoller } = require('rpg-dice-roller/lib/umd/bundle');

class Client{    
    constructor(socket, server){
        this.socket     = socket;
        this._server    = server;
        this.uid        = socket.id;
        this.room       = null;
        this.name       = null;
        this.characterUid = null;
        this.init();
        this.ticks = 0;
        this.dice = new DiceRoller();
    }

    roll(dice){
        let roll = this.dice.roll(dice).toString();
        let results = roll
				.match(/\[.*\]/g)[0]
				.replace(/(\[)|(\])/g, "")
				.split(",");
        if (!Array.isArray(results)) {
            results = [...results];
        }
        return results;
    }

    tick(){
        this.ticks++;
        if (this.ticks >= 100){
            this.ticks = 0;
        }
    }

    send(message, data = null){
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