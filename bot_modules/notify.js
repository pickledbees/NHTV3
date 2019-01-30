const assert = require('assert');
const IDPool = require('./idpool');
const TelegramBot = require('node-telegram-bot-api');

class Notify extends IDPool{
    constructor(location, bot) {
        super(location);
        assert(bot instanceof TelegramBot);
        this.bot = bot;
    }

    async disseminate(message) {
        const id = message.chat.id;
        const message_id = message.message_id;
        (await this.getMembers()).forEach(member => {
            this.bot.sendMessage(member, '<b>*Notification*</b>')
                .then(() => this.bot.forwardMessage(member, id, message_id));
        });
    }
}

module .exports = Notify;