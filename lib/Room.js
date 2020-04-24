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
        this.dynamicMap = null;
        this.currentMap = null;
        this.pins = [];
        this.allowInput = true;
    }

    togglePlayerInput(value){
        this.allowInput = value;
        if (!this.allowInput){
            this.entities = [];
            this.pins = [];
            this.dynamicMap = null;
            for (let i = 0; i < this.clients.length; i++){
                this.clients[i].send('init-map', {
                    url: this.currentMap,
                    entities: this.entities,
                    pins: this.pins,
                    drawing: this.dynamicMap
                });
                this.clients[i].send('clear-drawing');
            }
        }
    }

    clearDynamicMap(uid){
        this.dynamicMap = null;
        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].uid !== uid){
                this.clients[i].send('clear-drawing');
            }
        }
    }

    renderDynamicMap(drawing, uid){
        this.dynamicMap = drawing;
        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].uid !== uid){
                this.clients[i].send('render-drawing', drawing);
            }
        }
    }

    removeEntity(uid){
        for (let i = 0; i < this.entities.length; i++){
            if (this.entities[i].uid === uid){
                this.entities.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('render-entities', this.entities);
        }
    }

    removePin(uid){
        for (let i = 0; i < this.pins.length; i++){
            if (this.pins[i].uid === uid){
                this.pins.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('render-pins', this.pins);
        }
    }

    addEntity(data){
        if (!this.allowInput){
            return;
        }
        const entity = data;
        entity.uid = uuid();
        this.entities.push(entity);
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('render-entities', this.entities);
        }
    }

    placePin(data){
        if (!this.allowInput){
            return;
        }
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
            pins: this.pins,
            drawing: this.dynamicMap
        });
    }

    updatePosition(data){
        if (!this.allowInput){
            return;
        }
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
        this.dynamicMap = null;
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

    setInitiationOrder(order){
        this.initiationOrder = order;
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('initiation-order', this.initiationOrder);
            if (this.clients[i].characterUid === this.initiationOrder[0].uid){
                this.clients[i].send('ping-player');
                break;
            }
        }
        this.onDeck(this.initiationOrder[1].uid);
        this.updateCombatOrderHighlight(0);
    }

    onDeck(uid){
        let isPlayer = false;
        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].characterUid === uid){
                this.clients[i].send('on-deck');
                isPlayer = true;
                break;
            }
        }
        if (!isPlayer){
            for (let i = 0; i < this.initiationOrder.length; i++){
                if (this.initiationOrder[i].uid === uid){
                    for (let c = 0; c < this.clients.length; c++){
                        this.clients[c].send('notify', {
                            title: `NPC On Deck`,
                            message: `${this.initiationOrder[i].name} is next up in the combat order.`
                        });
                    }
                    break;
                }
            }
        }
    }

    updateCombatOrderHighlight(index){
        for (let i = 0; i < this.clients.length; i++){
            this.clients[i].send('update-initiation-index', index);
        }
    }

    updateCombatOrder(uid){
        let currentIndex = 0;
        for (let i = 0; i < this.initiationOrder.length; i++){
            if (uid === this.initiationOrder[i].uid){
                currentIndex = i;
                break;
            }
        }

        this.updateCombatOrderHighlight(currentIndex);

        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].characterUid === uid){
                this.clients[i].send('ping-player');
                break;
            }
        }
        
        let nextIndex = currentIndex + 1;
        if (nextIndex === this.initiationOrder.length){
            nextIndex = 0;
        }

        this.onDeck(this.initiationOrder[nextIndex].uid);        
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