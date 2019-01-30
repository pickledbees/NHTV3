'use strict';

const fs = require('fs');
const assert = require('assert');
const util = require('util');
const {JSONFile, MessageManager, PhotoManager} = require('./file_util');

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
        assert(messageManager instanceof MessageManager);
        super(id);
        this._msgMgr = messageManager;
    }

    subscribe(socket) {
        socket.on('get_texts', async data => {
            if (data.id === this.id) {
                const messages = await this._msgMgr.getMessages(data.number);
                socket.emit('texts', {
                    id: this.id,
                    messages: messages,
                });
            }
        });
        super.subscribe(socket);
    }

    displayCallback(message, socket) {
        socket.emit('texts', {
            id: this.id,
            messages: [message]
        });
    }
}

class PhotoDisplay extends Display {
    constructor(id, photoManager) {
        assert(photoManager instanceof PhotoManager);
        super(id);
        this._photoMgr = photoManager;
    }

    subscribe(socket) {
        socket.on('get_photos', async data => {
            if (data.id === this.id) {
                const messages = await this._photoMgr.getMessages(data.number);
                socket.emit('photos', {
                    id: this.id,
                    messages: messages,
                });
            }
        });
        super.subscribe(socket);
    }

    displayCallback(message, socket) {
        socket.emit('photos', {
            id: this.id,
            messages: [message],
        });
    }
}

class PagesDisplay extends Display {
    constructor(id, jsonFile) {
        assert(jsonFile instanceof JSONFile);
        super(id);
        this._file = jsonFile;
    }

    subscribe(socket) {
        socket.on('get_pages', data => {
            if (data.id === this.id)
                this._file.read((err, json) => {
                    if (!err)
                        socket.emit('pages', {
                            id : this.id,
                            pages: json
                        });
                });
        });
        super.subscribe(socket);
    }

    setPages(pages) {
        this._file.write(pages);
    }

    getPages(pages, callback) {
        this._file.read(callback);
    }

    display(pages) {
        if (pages === undefined) {
            this._file.read((err, json) => {
                if (!err)
                    super.display(json);
            });
        } else {
            super.display(pages);
        }
    }

    //Alias for .display() without arguments
    updateDisplay() {
        this.display();
    }

    displayCallback(pages, socket) {
        socket.emit('pages', {
            id: this.id,
            pages: pages
        });
    }
}

module.exports = {
    Display: Display,
    TextDisplay: TextDisplay,
    PhotoDisplay: PhotoDisplay,
    PagesDisplay: PagesDisplay,
};