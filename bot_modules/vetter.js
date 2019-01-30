const assert = require('assert');
const IDPool = require('./idpool');
const TelegramBot = require('node-telegram-bot-api');

//represents a vetting pool from vetters can be called to vet a message
class Vetter extends IDPool {
    constructor(location, bot) {
        super(location);
        assert(bot instanceof TelegramBot);
        this.bot = bot;
    }

    //allocates a random vetter in the pool to vet the message
    //returns a promise that resolves to true / false on verdict
    //if there are no vetters in the pool, a promise resolved to false is returned
    async vet(message) {
        const vArr = await this.getMembers();
        try {
            const id = _getRandom(vArr);
            return _vet(message, id, this.bot); //switchable implementation
        } catch (e) {
            return false;
        }
    }
}

function _getRandom(arr) {
    if (arr.length === 0) throw new Error('expected array with at least one element');
    return arr[Math.floor(Math.random() * (arr.length - 1))];
}

function _vet(message, id, bot) {
    return new Promise(async (resolve, reject) => {
        try {
            await bot.forwardMessage(id, message.chat.id, message.message_id);
            const txt = `Post submission from <b>${message.chat.first_name}</b>`;
            const sent = await bot.sendMessage(id, txt, {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'Approve', callback_data: 'Approved'}, {text: 'Reject', callback_data: 'Rejected'}]
                    ],
                }
            });
            const listener = query => {
                if (query.message.message_id === sent.message_id) {
                    bot.answerCallbackQuery(query.id);
                    bot.removeListener('callback_query', listener);
                    bot.editMessageText(txt + ' - ' + query.data, {
                        chat_id: sent.chat.id,
                        message_id: sent.message_id
                    });
                    resolve(query.data === 'Approved');
                }
            };
            bot.on('callback_query', listener);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = Vetter;
