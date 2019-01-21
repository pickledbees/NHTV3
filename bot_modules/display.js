'use strict';

const fs = require('fs');
const assert = require('assert');
const util = require('util');
const {MessageManager, PhotoManager} = require('./file_util');

class Display {
    constructor(id) {
        this._sockets = new Set;
        this.id = id;
    }

    //adds client socket to the Display
    subscribe(socket) {
        this._sockets.add(socket);
    }

    //removes a client socket from the Display
    unsubscribe(socket) {
        this._sockets.delete(socket);
    }

    //calls the 'displayCallback' method on each of the socket clients
    display(data) {
        const sockets = [...this._sockets];
        sockets.forEach(socket => {
            this.displayCallback(data, socket);
        });
    }

    //called by the 'display' method, to be implemented in extended class
    displayCallback(data, socket) {
        //to be implemented by extended classes
    }
}

class TextDisplay extends Display {
    constructor(id, messageManager) {
        super(id);
        assert(messageManager instanceof MessageManager);
        this._msgMgr = messageManager;
    }

    subscribe(socket) {
        socket.on('get_text_posts', data => {
            if (data.id === this.id) {
                const messages = this._msgMgr.getMessages(data.number);
                socket.emit('text_posts', {
                    id: this.id,
                    messages: messages,
                });
            }
        });
        super.subscribe(socket);
    }

    displayCallback(message, socket) {
        socket.emit('text_posts', {
            id: this.id,
            messages: [message]
        });
    }
}

class PhotoDisplay extends Display {
    constructor(id, photoManager) {
        super(id);
        assert(photoManager instanceof PhotoManager);
        this._photoMgr = photoManager;
    }

    subscribe(socket) {
        socket.on('get_photo_posts', async data => {
            if (data.id === this.id) {
                const messages = this._photoMgr.getMessages(data.number);
                const promises = messages.map(async message => {
                    message.photo = 'data:image/jpeg;base64,' +
                        (await util.promisify(fs.readFile)(message.path)).toString('base64');
                    delete message.path;
                    return message;
                });
                const converted = await Promise.all(promises);
                socket.emit('photo_posts', {
                    id: this.id,
                    messages: converted,
                });
            }
        });
        super.subscribe(socket);
    }

    async displayCallback(message, socket) {
        const photoPath = message.path;
        const photo = await util.promisify(fs.readFile)(photoPath);
        message.photo = 'data:image/jpeg;base64,' + photo.toString('base64');
        socket.emit('photo_posts', {
            id: this.id,
            messages: [message],
        });
    }
}

module.exports = {
    Display: Display,
    TextDisplay: TextDisplay,
    PhotoDisplay: PhotoDisplay,
};