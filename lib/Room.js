const { DiceRoller } = require('rpg-dice-roller/lib/umd/bundle');

class Room{    
    constructor(uid, debug){
        this.uid = uid;
        this.clients = [];
        this.dice = new DiceRoller();
        this.debug = debug;
        this.initiationOrder = [];
    }

    handleNPCPing(name){
        let currentIndex = 0;
        for (let i = 0; i < this.initiationOrder.length; i++){
            if (name === this.initiationOrder[i].name){
                currentIndex = i;
                break;
            }
        }
        let nextIndex = currentIndex + 1;
        if (nextIndex === this.initiationOrder.length){
            nextIndex = 0;
        }
        const entity = this.initiationOrder[nextIndex];
        if (entity.characterUid){
            for (let i = 0; i < this.clients.length; i++){
                if (this.clients[i].characterUid === entity.characterUid){
                    this.clients[i].send('on-deck');
                    break;
                }
            }
        }else{
            for (let i = 0; i < this.clients.length; i++){
                this.clients[i].send('notify', {
                    title: `NPC On Deck`,
                    message: `${entity.name} is next up in the combat order.`
                });
            }
        }
    }

    setInitiationOrder(order){
        this.initiationOrder = order;
        if (this.debug){
            console.log('Updated initiation order');
        }
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('initiation-order', this.initiationOrder);
        }
    }

    onDeck(characterUid){
        let currentIndex = 0;
        for (let i = 0; i < this.initiationOrder.length; i++){
            if (characterUid === this.initiationOrder[i].characterUid){
                currentIndex = i;
                break;
            }
        }
        let nextIndex = currentIndex + 1;
        if (nextIndex === this.initiationOrder.length){
            nextIndex = 0;
        }
        const entity = this.initiationOrder[nextIndex];
        if (entity.characterUid){
            for (let i = 0; i < this.clients.length; i++){
                if (this.clients[i].characterUid === entity.characterUid){
                    this.clients[i].send('on-deck');
                    break;
                }
            }
        }else{
            for (let i = 0; i < this.clients.length; i++){
                this.clients[i].send('notify', {
                    title: `NPC On Deck`,
                    message: `${entity.name} is next up in the combat order.`
                });
            }
        }
    }

    pingPlayer(characterUid){
        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].characterUid === characterUid){
                this.clients[i].send('ping-player');
                if (this.debug){
                    console.log(`Sending ping to ${this.clients[i].name}`);
                }
                this.onDeck(characterUid);
                break;
            }
        }
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
                this.clients[i].send('roll-notificaiton', {
                    character: client.name,
                    results: results,
                    dice: dice
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