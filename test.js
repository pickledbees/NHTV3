const fs = require('fs');
const path = require('path');
const app = require('express')();
const svr = require('http').createServer(app);
const io = require('socket.io')(svr);
const EventEmitter = require('events');

io.on('connection', socket => {
    console.log('display client connected');
    socket.on('display', () => {
        console.log('getting img...');
        const img = fs.readFileSync(path.join(__dirname, 'test_images', '2.JPG'));
        socket.emit('image', img.toString('base64'));
        console.log('file sent');
    });
});

app.get('/test', (request, response) => {
    response.sendFile(path.join(__dirname, 'testsite.html'));
});

svr.listen(3000);
console.log('NHTV server started');

class LOL extends EventEmitter{
    constructor() {
        super();
        this.yes = 'hm';
    }

    hello() {
        this.on('lol', () => console.log(this.yes))
    }
}