'use strict';

function TextDisplayClient(id, socket) {
    this._socket = socket;
    this.id = id;
    this.posts = [];
    socket.on('text_posts', data => {
        if (data.id === this.id) {
            data.messages.forEach(message => this.posts.push(message));
            this.onPosts(data.messages);
        }
    });
}

TextDisplayClient.prototype.getPosts = function(number) {
    this._socket.emit('get_text_posts', {
        id: this.id,
        number: number,
    });
};

TextDisplayClient.prototype.onPosts = function(messages) {};


/*
TextPostDisplayClient._createPostElement = function(message) {
    const text = message.text;
    const username = message.chat.username;

    const post = document.createElement('p');
    const bold = document.createElement('b');
    bold.textContent = username.toUpperCase() + ': ';
    post.appendChild(bold);
    const tn = document.createTextNode(text);
    post.appendChild(tn);
    post.style.marginBottom = '3px';
    return post;
};
*/