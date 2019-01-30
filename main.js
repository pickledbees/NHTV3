'use strict';

//Online Version

const PubsBot = require('./bot_modules/telegrambots');
const path = require('path');
const fs = require('fs');
const https = require('https');
const get = require('./bot_modules/get');
const {File, JSONFile, PhotoManager, MessageManager, Directory} = require('./bot_modules/file_util');
const {TextDisplay, PhotoDisplay, PagesDisplay} = require('./bot_modules/display');
const IDPool = require('./bot_modules/idpool');
const Vetter = require('./bot_modules/vetter');
const Notify = require('./bot_modules/notify');



//set up bot
function run() {
    console.log('starting NHTV bot...');

    const TOKEN = fs.readFileSync('C:\\Users\\Lim Han Quan\\Desktop\\TOKENS\\NHTVPROTO.txt', 'utf8');
    const bot = new PubsBot(TOKEN, {polling: true});

    bot.onText('/ok', console.log);


//Set up Admin Pool(
    const adminPoolDirPath = path.join(__dirname, 'info', 'admins');
    const adminPool = new IDPool(adminPoolDirPath);

    bot.onCommand('/ahoy_matey', message => {
        const id = message.chat.id;
        adminPool.addToPool(id);
        bot.sendMessage(id, '<b>Privileged PubsBot commands can now be used in this chat</b>');
    });

    bot.onCommand('/bye_matey', message => {
        const id = message.chat.id;
        adminPool.removeFromPool(id);
        bot.sendMessage(id, '<b>This chat may no longer use privileged PubsBot commands</b>')
    });


    const commandsText = '<b>Here are some things I can do for you:\n</b>' +
        '/start - Bring back this dialogue\n' +
        '/post - Send a text / photo to the screen\n' +
        '/poster - Send a poster to the screen\n' +
        '/anc - Send an announcement to the screen\n' +
        //'/news - Get announcements displayed on the PubsBot Screen\n' +
        '/subscribe - Subscribe to PubsBot notifications\n' +
        '/unsubscribe - Unsubscribe to PubsBot notifications\n' +
        '/cats - wait what?\n' +
        '/feedback - give me some feedback!';
    const privCommandsText = '\n\n' +
        '<b>Privileged Commands:</b>\n' +
        '/vetp - Become a poster vetter\n' +
        '/xvetp - Stop being a poster vetter\n' +
        '/veta - Become an announcement vetter\n' +
        '/xveta - Stop being an announcement vetter\n' +
        '/send - Send a message to all subscribers\n' +
        '\n' +
        '/reset - Reset the bot to a clean configuration';


//Start handler
    bot.onCommand('/start', message => {
        const id = message.chat.id;
        const reply = 'Hello<b> ' + message.chat.first_name + '</b>!\n\n' +
            commandsText +
            (adminPool.isInPool(id) ? privCommandsText : '');
        bot.sendMessage(id, reply);
    });


//Some text replies
    bot.setReply('Hello', 'Jello');
    bot.setReply('Mellow', 'Yellow');
    bot.setReply('Hi', 'Bye');
    bot.setReply('What is the answer to life, the universe and everything?', '42');


//Cat replies
    bot.onCommand('/cats', message => {
        const id = message.chat.id;
        bot.sendMessage(id, 'Fetching a feline friend for you...');
        get('https://api.thecatapi.com/v1/images/search?size=full\'')
            .then(data => {
                const purl = JSON.parse(data)[0].url;
                bot.sendPhoto(id, purl, {
                    caption: (() => {
                        let num = Math.floor(Math.random() * 20);
                        const meows = [];
                        while (num--)
                            meows.push(Math.random() > 0.4 ? 'meow' : 'Meow');
                        return meows;
                    })().join(' ')
                });
            })
    }, {
        group: true
    });


//Set up Text / Photo post handlers
    bot.onCommand('/post', message => {
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
        r.send(id, 'Send me a text / photo:');
        r.cancel(120000);
    });

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


//Prepare vetters for Posters
    const posterVetterInfoDirPath = path.join(__dirname, 'info', 'poster_vetters');
    const posterVetter = new Vetter(posterVetterInfoDirPath, bot);

    bot.onCommand('/vetp', message => {
        const id = message.chat.id;
        if (!adminPool.isInPool(id)) return;
        posterVetter.addToPool(id);
        bot.sendMessage(id, '<b>You may now receive posters submitted for vetting</b>\n' +
            'Use the command /xvetp anytime to stop receiving poster submissions');
    }, {
        group: true
    });

    bot.onCommand('/xvetp', message => {
        const id = message.chat.id;
        if (!adminPool.isInPool(id)) return;
        posterVetter.removeFromPool(id);
        bot.sendMessage(id, '<b>You have now no longer a poster vetter</b>');
    }, {
        group: true
    });


//Set up Poster Post handler
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
        r.send(id, "Send me the poster to display!\n\n" +
            "Include a link in the caption and I'll convert it to a QR code on screen.");
        r.cancel(120000);
    });

    const posterPostDirPath = path.join(__dirname, 'posts', 'poster_posts');
    const posterPostManager = new PhotoManager(posterPostDirPath, bot);
    const posterPostDisplay = new PhotoDisplay(3, posterPostManager);

    async function handlePoster(message) {
        const id = message.chat.id;
        const message_id = message.message_id;
        bot.replyToMessage(id, message_id, 'Poster submitted for vetting.');
        const approved = await posterVetter.vet(message);
        if (approved) {
            const stored = await posterPostManager.store(message);
            posterPostDisplay.display(stored);
            bot.replyToMessage(id, message_id, '<b>Poster has been approved and uploaded!</b>');
        } else {
            bot.replyToMessage(id, message_id, '<b>Sorry, your poster has been rejected.</b>');
        }
    }


//Prepare vetters for Announcements
    const ancVetterDirPath = path.join(__dirname, 'info', 'anc_vetters');
    const ancVetter = new Vetter(ancVetterDirPath, bot);

    bot.onCommand('/veta', message => {
        const id = message.chat.id;
        if (!adminPool.isInPool(id)) return;
        ancVetter.addToPool(id);
        bot.sendMessage(id, '<b>You may now receive announcements submitted for vetting</b>\n' +
            'Use the command /xveta anytime to stop receiving poster submissions');
    }, {
        group: true
    });

    bot.onCommand('/xveta', message => {
        const id = message.chat.id;
        if (!adminPool.isInPool(id)) return;
        ancVetter.removeFromPool(id);
        bot.sendMessage(id, '<b>You are now no longer an announcement vetter</b>');
    }, {
        group: true
    });


//Set up Announcement Post handlers
    bot.onCommand('/anc', message => {
        const id = message.chat.id;
        const r = bot.createRequest();
        r.onResponse = message => {
            if (message.text) {
                handleAnc(message);
            } else {
                r.send(id, "Oops, that's not a text, try again!");
            }
        };
        r.send(id, 'Send me the announcement you want to make:');
        r.cancel(120000);
    });

    const ancDirPath = path.join(__dirname, 'posts', 'announcements');
    const ancManager = new MessageManager(ancDirPath);
    const ancDisplay = new TextDisplay(4, ancManager);

    async function handleAnc(message) {
        const id = message.chat.id;
        const message_id = message.message_id;
        bot.replyToMessage(id, message_id, 'Announcement submitted for vetting.');
        const approved = await ancVetter.vet(message);
        if (approved) {
            await ancManager.store(message);
            ancDisplay.display(message);
            bot.replyToMessage(id, message_id, '<b>Announcement has been approved and uploaded!</b>');
        } else {
            bot.replyToMessage(id, message_id, '<b>Sorry, your announcement has been rejected.</b>')
        }
    }

    bot.onCommand('/news', message => {
        //TODO: implement
    });


//Feedback Handler
    const feedbackDirPath = path.join(__dirname, 'posts', 'feedback');
    const feedbackManager = new MessageManager(feedbackDirPath, bot);

    bot.onCommand('/feedback', message => {
        const id = message.chat.id;
        const r = bot.createRequest();
        r.onResponse = async message => {
            if (message.text) {
                await feedbackManager.store(message);
                bot.replyToMessage(id, message.message_id, 'Thanks for the feedback!');
            } else {
                r.send(id, 'Sorry, the feedback needs to be in text form, try again!');
            }
        };
        r.send(id, 'Send me your feedback:');
        r.cancel(120000);
    });


//Set up Notifier
    const notifyListDirPath = path.join(__dirname, 'info', 'notify_list');
    const notifier = new Notify(notifyListDirPath, bot);

    bot.onCommand('/subscribe', message => {
        const id = message.chat.id;
        notifier.addToPool(id);
        bot.sendMessage(id, '<b>This chat is now subscribed to PubsBot Notifications!</b>');
    }, {
        group: true
    });

    bot.onCommand('/unsubscribe', message => {
        const id = message.chat.id;
        notifier.removeFromPool(id);
        bot.sendMessage(id, '<b>This chat is now unsubscribed to PubsBot Notifications</b>')
    }, {
        group: true
    });

    bot.onCommand('/send', message => {
        const id = message.chat.id;
        if (!adminPool.isInPool(id)) return;
        const r = bot.createRequest();
        r.onResponse = message => {
            notifier.disseminate(message);
            bot.replyToMessage(id, message.message_id, '<b>Message forwarded to all subscribers of PubsBot Notifications!</b>');
        };
        r.send(id, 'Send me the message you want to forward to all subscribers of PubsBot notifications:');
        r.cancel(120000);
    });


//Reset Command Handler
    bot.onCommand('/reset', async message => {
        const id = message.chat.id;
        if (!adminPool.isInPool(id)) return;
        const r = bot.createRequest();
        r.onResponse = message => {
            if (message.text === '0000') {
                textPostManager.empty();
                photoPostManager.flush();
                posterPostManager.flush();
                ancManager.empty();
                adminPool.clearPool();
                posterVetter.clearPool();
                ancVetter.clearPool();
                bot.sendMessage(id, '<b>Bot has been reset</b>');
            } else {
                bot.sendMessage('<b>Sorry, invalid code</b>');
            }
        };
        r.onCancel = message => {
            bot.sendMessage(id, '<b>Reset Cancelled</b>');
        }
        r.send(id, '<b>WARNING: You are resetting PubsBot</b>\n' +
            'Resetting the bot flushes all existing files and data submitted to the bot since its last reset,\n' +
            'including all admin or any rights granted for ALL users. However, its functionality will remain unchanged. ' +
            'All admin rights can be restored with the correct command.\n\n' +
            '<b>Send me the reset code to proceed with the reset:</b>');
    });

    console.log('NHTV bot started');


//Set up Pages Display
    const pageListing = new JSONFile(path.join(__dirname, 'static', 'pages', 'page_listing.js'));
    const mainWindowDisplay = new PagesDisplay(5, pageListing);

//Server Set Up
    console.log('Starting NHTV Server...');
    const express = require('express');
    const app = express();

//Set up static file requests
    const statics = pather(__dirname, 'static');
    app.use('/pages', express.static(statics('pages')()));
    app.use('/scripts', express.static(statics('scripts')()));
    app.use('/images', express.static(statics('images')()));
    app.use('/styles', express.static(statics('styles')()));

//Socket Set Up
    const svr = require('http').createServer(app);
    const io = require('socket.io')(svr);

//Display subscriptions
    io.on('connection', socket => {
        console.log('client connected');

        textPostDisplay.subscribe(socket);
        photoPostDisplay.subscribe(socket);
        posterPostDisplay.subscribe(socket);
        ancDisplay.subscribe(socket);
        mainWindowDisplay.subscribe(socket);
        socket.on('disconnect', () => {
            textPostDisplay.unsubscribe(socket);
            photoPostDisplay.unsubscribe(socket);
            posterPostDisplay.unsubscribe(socket);
            ancDisplay.subscribe(socket);
            mainWindowDisplay.unsubscribe(socket);
        });
    });


//Listen on Port
    svr.listen(3000);
    console.log('NHTV server started');
}


//Main Run
    const Logger = require('./bot_modules/logger');
    const mainLog = new Logger(path.join(__dirname, 'logs', 'error_logs.js'));
    try {
        run();
    } catch (e) {
        mainLog.log(e.message, true);
        run();
    }

//Utility definitions

//Constructs path - uses currying
    function pather(...args) {
        if (args.length === 0) return;
        const joined = path.join(...args);
        return (..._args) => {
            if (_args.length === 0)
                return joined;
            return pather(joined, ..._args);
        }
    }
