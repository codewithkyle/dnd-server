class Room{    
    constructor(uid){
        this.uid = uid;
        this.clients = [];
    }

    addClient(clientUid){
        this.clients.push(clientUid);
    }

    removeClient(clientUid){
        for (let i = 0; i < this.clients.length; i++){
            if (this.clients[i].uid === clientUid){
                this.clients.splice(i, 1);
                break;
            }
        }
    }
}
module.exports = Room;