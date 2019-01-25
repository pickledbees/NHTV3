'use strict';

const TelegramBot = require('node-telegram-bot-api');

//Represents a request that can be sent to a chat. Any response from the chat triggers the callback set by the onResponse setter.
//multiple requests sent to the same chat will all complete when a single response is received
class _Request {
    constructor(bot) {
        this._bot = bot;
        this._callback = message =>
            console.log('message ' + message.message_id + ' received');
    }


    //cancels a request
    cancel(timeout) {
        if (timeout) {
            setTimeout(this.cancel.bind(this), timeout);
        } else {
            this._bot.removeListener('message', this._listener);
            this._bot.removeListener('callback_query', this._qryListener);
        }
    }

    //sends the request to a chat id
    //any requests sent to the chat id previously is cancelled before this request is sent
    send(id, text) {
        const bot = this._bot;

        this._listener = message => {
            if (message.chat.id === id) {
                this.cancel();
                if (!RegExp('^/').test(message.text)) {
                    this._callback(message);
                }
            }
        };
        this._bot.on('message', this._listener);

        const kb = [[{text: 'Cancel', callback_data: 'cancel_request'}]];

        this._qryListener = query => {
            if (query.message.chat.id === id && query.data === 'cancel_request') {
                this.cancel();
                bot.answerCallbackQuery(query.id);
                bot.sendMessage(query.message.chat.id, '<b>Request Cancelled</b>');
                if (this._cancelCallback) this._cancelCallback(query);
            }
        };
        bot.on('callback_query', this._qryListener);

        return bot.sendMessageWithInlineKeyboard(id, text, kb);
    }

    //sets the callback to call when there is a response to the request
    //.cancel(query) is called automatically when set callback is called
    set onResponse(callback) {
        this._callback = callback;
    }

    //sets the callback to call when there is a cancel to the request
    set onCancel(callback) {
        this._cancelCallback = callback;
    }
}

//TelegramBot with more features
class PubsBot extends TelegramBot {
    constructor(token, options) {
        super(token, options);
        this._waitList = {};
    }

    //sends a message to a chat, defaults to HTML parse mode
    sendMessage(chatId, text, form = {}) {
        if (form.parse_mode === undefined) form.parse_mode = 'HTML';
        return super.sendMessage(chatId, text, form);
    }

    //sends a message to a chat with an inline keyboard
    sendMessageWithInlineKeyboard(chatId, text, keyboard, form = {}) {
        form.reply_markup = {inline_keyboard: keyboard};
        return this.sendMessage(chatId, text, form);
    }

    editMessageText(text, form = {}) {
        form.parse_mode = 'HTML';
        return super.editMessageText(text, form);
    }

    createRequest() {
        return new _Request(this);
    }

    //refined onText method, defaults to non-regex exact text matching
    onText(text, callback) {
        let pattern = text;
        if (!(text instanceof RegExp)) {
            pattern = new RegExp('^' + text + '$');
        }
        super.onText(pattern, callback);
    }

    //alias for onText
    onCommand(command, callback, privileged = false) {
        this.onText(command, callback);
    }

    //reply handler
    setReply(text, replyText, form) {
        this.onText(text, message => {
            this.sendMessage(message.chat.id, replyText, form);
        });
    }

    replyToMessage(chatId, messageId, text, form = {}) {
        form.reply_to_message_id = messageId;
        this.sendMessage(chatId, text, form);
    }

    expect(chatId, action) {
        if (!this._waitList[chatId]) this._waitList[chatId] = new Set();
        this._waitList[chatId].add(action);
    }

    expecting(chatId, action) {
        const chat = this._waitList[chatId];
        if (chat) return chat.has(action);
        return false;
    }

    stopExpecting(chatId, action) {
        const wl = this._waitList;
        if (action) {
            if (this.expecting(chatId, action)) wl[chatId].delete(action);
            if (wl[chatId].size === 0) delete wl[chatId];
        } else {
            delete wl[chatId];
        }
    }

    downloadPhoto(photo, downloadDir) {
        const maxRes = photo.length - 1;
        const fileId = photo[maxRes].file_id;
        return this.downloadFile(fileId, downloadDir);
    }
}

module.exports = PubsBot;