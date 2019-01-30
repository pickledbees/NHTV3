'use strict';

//Text Display Client
    function TextDisplayClient(id, socket) {
        this._socket = socket;
        this.id = id;
        socket.on('texts', data => {
            if (data.id === this.id)
                this.onTexts(data.messages);
        });
    }
    TextDisplayClient.prototype.getTexts = function(number) {
        this._socket.emit('get_texts', {
            id: this.id,
            number: number,
        });
    };
    TextDisplayClient.prototype.onTexts = function(messages) {};


//Photo Display Client
    function PhotoDisplayClient(id, socket) {
        this._socket = socket;
        this.id = id;
        socket.on('photos', data => {
            if (data.id === this.id) {
                this.onPhotos(data.messages);
            }
        });
    }
    PhotoDisplayClient.prototype.getPhotos = function(number) {
        this._socket.emit('get_photos', {
            id: this.id,
            number: number,
        });
    };
    PhotoDisplayClient.prototype.onPhotos = function(messages) {};


//Pages Display Client
    function PagesDisplayClient(id, socket) {
        this._socket = socket;
        this.id = id;
        socket.on('pages', data => {
            if (data.id === this.id)
                this.onPages(data.pages);
        });

    }
    PagesDisplayClient.prototype.getPages = function() {
        this._socket.emit('get_pages', {
            id: this.id,
        });
    };
    PagesDisplayClient.prototype.onPages = function(pages) {};

