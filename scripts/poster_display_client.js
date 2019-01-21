'use strict';

function TextPostDisplayClient(socket) {
    this._socket = socket;
    this.posts = [];
    socket.on('text_posts', messages => {
        this.posts.push(...messages);
        this.onPosts(messages);
    });
}

TextPostDisplayClient.prototype.getPosts = function() {
    this._socket.emit('get_text_posts');
};

TextPostDisplayClient.prototype.onPosts = function(messages) {};