const { DiceRoller } = require('rpg-dice-roller/lib/umd/bundle');
const uuid = require('uuid').v4;

class Room{    
    constructor(uid, debug){
        this.uid = uid;
        this.clients = [];
        this.dice = new DiceRoller();
        this.debug = debug;
        this.initiationOrder = [];
        this.entities = [];
        this.currentMap = null;
        this.pins = [];
    }

    addEntity(data){
        const entity = data;
        entity.uid = uuid();
        this.entities.push(entity);
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('render-entities', this.entities);
        }
    }

    placePin(data){
        const pin = {
            pos: data.pos,
            label: data.label,
            uid: uuid()
        };
        this.pins.push(pin);
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('render-pins', this.pins);
        }
    }

    pingPos(pos, senderUid){
        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].uid !== senderUid){
                this.clients[i].send('ping-pos', pos);
            }
        }
    }

    initUserMap(client){
        client.send('init-map', {
            url: this.currentMap,
            entities: this.entities,
            pins: this.pins
        });
    }

    updatePosition(data){
        let foundEntity = false;
        for (let i = 0; i < this.entities.length; i++){
            if (this.entities[i].uid === data.uid){
                foundEntity = true;
                this.entities[i].pos = data.pos;
                break;
            }
        }
        if (!foundEntity){
            this.entities.push(data);
        }
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('render-entities', this.entities);
        }
    }

    loadMap(url){
        this.entities = [];
        this.pins = [];
        this.currentMap = url;
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('load-map', url);
        }
    }

    clearInitiationOrder(){
        this.initiationOrder = [];
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('clear-order');
        }
    }

    handleNPCPing(name){
        let currentIndex = 0;
        for (let i = 0; i < this.initiationOrder.length; i++){
            if (name === this.initiationOrder[i].name){
                currentIndex = i;
                break;
            }
        }
        this.updateAcitvePlayerHighlight(currentIndex);
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
            if (this.clients[i].characterUid === this.initiationOrder[0].characterUid){
                this.clients[i].send('ping-player');
                this.onDeck(this.initiationOrder[0].characterUid);
            }
        }
        if (!this.initiationOrder[0].characterUid){
            this.handleNPCPing(this.initiationOrder[0].name);
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
        this.updateAcitvePlayerHighlight(currentIndex);
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

    updateAcitvePlayerHighlight(index){
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('update-initiation-index', index);
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
        client.room = this;
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