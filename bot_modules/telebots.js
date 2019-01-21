'use strict';

const TelegramBot = require('node-telegram-bot-api');
const {EventEmitter} = require('events');

class ConvoBot extends TelegramBot {
    constructor(token, options) {
        super(token, options);
        let bot = this;
        this.on('message', message => {
            bot.emit('response' + message.chat.id, message);
        });
        //to log incoming
        this.on('text', message => {
            let {text, from, chat} = message;
            let {first_name, username} = from;
            console.log(`'${text}' received from ${first_name} (${username}) | chatID: ${chat.id}`)
        });
        this._requests = {};
    }

    //Enable default HTML formatting on messages sent
    sendMessage(chatId, text, form = {}) {
        form.parse_mode = 'HTML';
        return super.sendMessage(chatId, text, form);
    }

    //Enable default exact match when string is passed in
    onText(text, callback) {
        let pattern = text;
        if (!(text instanceof RegExp)) {
            pattern = new RegExp('^' + text + '$');
        }
        super.onText(pattern, callback);
    }

    //Alias for onText
    onCommand(command, callback) {
        this.onText(command, callback);
    }

    //Enable replies to certain texts
    reply(text, replyText, form) {
        let bot = this;
        bot.onText(text, message => {
            bot.sendMessage(message.chat.id, replyText, form);
        });
    }

    //Prompt user for something and await response
    request(chatId, text, form) {
        let bot = this;
        bot.sendMessage(chatId, text, form);
        return new Promise(resolve => {
            bot.removeAllListeners('response' + chatId);
            bot.once('response' + chatId, message => resolve(message));
        });
    }

    //Prompt user for something and await response as a direct reply to a message sent
    request_force(chatId, text, form = {}) {
        let bot = this;
        form.reply_markup = {force_reply: true};
        return new Promise(async resolve => {
            let {message_id} = await bot.sendMessage(chatId, text, form);
            bot._requests[chatId] = bot.onReplyToMessage(chatId, message_id, responseMsg => resolve(responseMsg));
        });
    }

    //Request listener removers
    removeRequestListener(chatId) {
        this.removeAllListeners('response' + chatId);
        this.removeReplyListener(this._requests[chatId]);
    }
}


function createDataButton(text, callback_data = text) {
    return {text: text, callback_data: callback_data};
}
function createUrlButton(text, url) {
    return {text: text, url: url};
}
function createGridKeyboard(max_rows, max_cols, buttons) {
    let i = 0;
    let keyboard = [];
    let row = [];
    let j;
    while (max_rows--) {
        row = [];
        j = max_cols;
        while (j-- && buttons[i]) {
            row.push(buttons[i++])
        }
        if (row.length === 0) break;
        keyboard.push(row);
    }
    return keyboard;
}
const std_numpad = (function () {
    let x = 10;
    let buttons = [];
    while (x--) buttons.push(createDataButton(x));
    return createGridKeyboard(4, 3, buttons);
})();

//telegram bot that provides windowing services
class WindowBot extends ConvoBot {
    constructor(token, options) {
        super(token, options);
        let bot = this;
        this.on('callback_query', query => {
            let {message_id,chat} = query.message;
            bot.answerCallbackQuery(query.id);
            bot.emit(message_id.toString() + 'callback_query' + chat.id, query);
        });
    }

    //creates a single button
    static createDataButton(text, callback_data) {
        return createDataButton(text, callback_data);
    }

    //creates a single button that opens a url
    static createUrlButton(text, url) {
        return createUrlButton(text, url);
    }

    //create a row of buttons out of strings, buttons or button rows
    static createRowKeyboard(elements) {
        let keyboard = [];
        elements.forEach(el => {
            if (el instanceof Array) {
                keyboard = keyboard.concat(el)
            } else if (el.text) {
                keyboard.push(el);
            } else {
                keyboard.push({text: el, callback_data: el});
            }
        });
        return [keyboard];
    }

    //creates a single keyboard out of strings, buttons, button rows or keyboards
    static createKeyboard(elements) {
        let keyboard = [];
        elements.forEach(el => {
            if (el instanceof Array) {
                if (el[0] instanceof Array) {   //if keyboard
                    keyboard = keyboard.concat(el);
                } else {    //if button row
                    keyboard.push(el);
                }
            } else if (el.text){    //if button
                keyboard.push([el]);
            } else {    //if normal string
                keyboard.push([{text: el, callback_data: el}]);
            }
        });
        return keyboard;
    }

    //creates an MCQ keyboard based on options passed in as strings
    static createMCQKeyboard(options) {
        let i = 1;
        let buttons = [];
        options.forEach(option => {
            let button = createDataButton(i.toString() + '. ' + option, i++);
            buttons.push([button]);
        });
        return buttons;
    }

    //creates a standard number pad keyboard
    static createStandardNumpad() {
        return std_numpad;
    }

    //sends a message with an inline keyboard
    sendMessageWithInlineKeyboard(chatId, text, keyboard, form = {}) {
        form.reply_markup = {inline_keyboard: keyboard};
        return this.sendMessage(chatId, text, form);
    }

    //sends a message with an inline standard number pad
    sendMessageWithInlineNumpad(chatId, text, form) {
        return this.sendMessageWithInlineKeyboard(chatId, text, std_numpad, form);
    }

    //sends a message with an inline keyboard of choice and resolves to the key pressed
    sendWindow(chatId, text, elements, form) {
        let keyboard = WindowBot.createKeyboard(elements);
        let bot = this;
        return new Promise(resolve => {
            bot.sendMessageWithInlineKeyboard(chatId, text, keyboard, form)
                .then(sentMsg => {
                    bot.once(sentMsg.message_id.toString() + 'callback_query' + chatId, query =>
                        resolve(query.data)
                    );
                });
        });
    }

    //sends a message with an inline standard number pad and resolves to the number pressed
    sendNumpad(chatId, text, form) {
        return this.sendWindow(chatId, text, std_numpad, form);
    }

    //sends a message with an inline keyboard of options and resolves to the number pf the option pressed
    sendMCQ(chatId, text, options, form) {
        let keyboard = WindowBot.createMCQKeyboard(options);
        return this.sendWindow(chatId, text, keyboard, form)
    }
}

module.exports = {
    TelegramBot: TelegramBot,
    ConvoBot : ConvoBot,
    WindowBot : WindowBot,
};