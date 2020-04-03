const { DiceRoller } = require('rpg-dice-roller/lib/umd/bundle');

class Room{    
    constructor(uid){
        this.uid = uid;
        this.clients = [];
        this.dice = new DiceRoller();
    }

    roll(dice, client){
        let roll = this.dice.roll(dice).toString();
        let results = roll
				.match(/\[.*\]/g)[0]
				.replace(/(\[)|(\])/g, "")
				.split(",");
        if (!Array.isArray(results)) {
            results = [...results];
        }
        
        client.send('roll', results);

        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].uid !== client.uid){
                client.send('roll-notificaiton', {
                    character: client.name,
                    result: results
                });
            }
        }
    }

    addClient(client){
        this.clients.push(client);
    }

    removeClient(client){
        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].uid === client.uid){
                this.clients.splice(i, 1);
                break;
            }
        }
    }
}
module.exports = Room;