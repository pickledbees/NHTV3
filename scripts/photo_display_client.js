'use strict';

function PhotoDisplayClient(id, socket) {
    this._socket = socket;
    this.id = id;
    this.posts = [];
    socket.on('photo_posts', data => {
        if (data.id === this.id) {
            data.messages.forEach(message => this.posts.push(message));
            this.onPosts(data.messages);
        }
    });
}

PhotoDisplayClient.prototype.getPosts = function(number) {
    this._socket.emit('get_photo_posts', {
        id: this.id,
        number: number,
    });
};

PhotoDisplayClient.prototype.onPosts = function(messages) {};