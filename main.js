'use strict';

const PubsBot = require('./bot_modules/telegrambots');
const path = require('path');
const fs = require('fs');
const {File, JSONFile, PhotoManager, MessageManager, Directory} = require('./bot_modules/file_util');
const {TextDisplay, PhotoDisplay} = require('./bot_modules/display');

//set up bot
console.log('starting NHTV bot...');

const TOKEN = fs.readFileSync('C:\\Users\\Lim Han Quan\\Desktop\\TOKENS\\NHTVPROTO.txt', 'utf8');
const bot = new PubsBot(TOKEN, {polling: true});

bot.onCommand('/start', message => {
    const id = message.chat.id;
    const reply = 'Hello<b> ' + message.chat.first_name + '</b>!\n' +
        'Here are some things I can do for you:\n' +
        '/help - Bring back this dialogue\n' +
        '/text - Send a text to the screen\n' +
        '/photo - Send a photo to the screen';
    bot.sendMessage(id, reply);
});

bot.setReply('hello', 'jello');
bot.setReply('mellow', 'yellow');

const textPostDirPath = path.join(__dirname, 'posts', 'text_posts');
const textPostManager = new MessageManager(textPostDirPath);
const textPostDisplay = new TextDisplay(1, textPostManager);

function handleTextPost(message) {
    textPostManager.store(message)
        .then(stored => {
            textPostDisplay.display(stored);
            bot.sendMessage(message.chat.id, `'<b>${stored.text}</b>' uploaded!`);
        });
}

const photoPostDirPath = path.join(__dirname, 'posts', 'photo_posts');
const photoPostManager = new PhotoManager(photoPostDirPath, bot);
const photoPostDisplay = new PhotoDisplay(2, photoPostManager);

function handlePhotoPost(message) {
    const id = message.chat.id;
    bot.sendMessage(id, 'Photo is being uploaded, this may take a while...');
    photoPostManager.store(message)
        .then(stored => {
            photoPostDisplay.display(stored);
            bot.replyToMessage(id, message.message_id, 'Photo uploaded!');
        });
}

bot.onCommand('/post', async message => {
    const id = message.chat.id;
    const r = bot.createRequest();
    r.onResponse = message => {
        if (message.photo) {
            handlePhotoPost(message);
        } else if (message.text) {
            handleTextPost(message);
        } else {
            r.send(id, "Oops, that's not a text / photo, try again!");
        }
    };
    r.timeout = 12000;
    r.send(id, 'Send me a text / photo:');
});

const posterPostDirPath = path.join(__dirname, 'posts', 'poster_posts');
const posterPostManager = new PhotoManager(posterPostDirPath, bot);
const posterPostDisplay = new PhotoDisplay(3, posterPostManager);

function handlePoster(message) {
    const id = message.chat.id;
    const message_id = message.message_id;
    bot.replyToMessage(id, message_id, 'Poster has been submitted for vetting.');
    const approved = true; //authenticator here
    if (approved) {
        posterPostManager.store(message)
            .then(stored => {
                posterPostDisplay.display(stored);
            });
        bot.replyToMessage(id, message.message_id, 'Poster has been vetted and uploaded!')
    }
}

bot.onCommand('/poster', message => {
    const id = message.chat.id;
    const r = bot.createRequest();
    r.onResponse = message => {
        if (message.photo) {
            handlePoster(message);
        } else {
            r.send(id, "Oops, that's not a photo, try again!");
        }
    };
    r.timeout = 12000;
    r.send(id, "Send me the poster to display!\nInclude a link in the caption if available, I'll convert it to a QR code.");
});

const ancDirPath = path.join(__dirname, 'posts', 'announcements');
const ancManager = new MessageManager(ancDirPath);
const ancDisplay = new TextDisplay(4, ancManager);

bot.onCommand('/anc', message => {
    //implementation
});

console.log('NHTV bot started');


//set up server
console.log('starting NHTV server...');
const express = require('express');
const app = express();
const svr = require('http').createServer(app);
const io = require('socket.io')(svr);

app.get('/main', (request, response) => {
    const index = path.join(__dirname, 'pages', 'index.html');
    response.sendFile(index);
});

app.use('/scripts', express.static('scripts'));
app.use('/images', express.static('images'));

app.get('/test1', (request, response) => {
    response.sendFile(path.join(__dirname, 'testsite.html'));
});

io.on('connection', socket => {
    console.log('display client connected');
    textPostDisplay.subscribe(socket);
    socket.on('disconnect', () => textPostDisplay.unsubscribe(socket));
    photoPostDisplay.subscribe(socket);
    socket.on('disconnect', () => PhotoDisplay.unsubscribe(socket));
});

svr.listen(3000);
console.log('NHTV server started');