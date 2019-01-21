'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const File = require('file-class');
const assert = require('assert');
const TelegramBot = require('node-telegram-bot-api');

function _mkDirIfNotExist(location) {
    if (!fs.existsSync(location))
        fs.mkdirSync(location);
}

function _assertExists(location) {
    if (!fs.existsSync(location))
        throw new Error(location + ' does not exist');
}

//directory must be created before instantiating Directory object
class Directory {
    constructor(location) {
        _assertExists(location);
        this.location = location;
    }

    //returns number of items in directory
    get size() {
        return this.readdirSync().length;
    }

    //returns true if there is nothing in the directory, false otherwise
    get isEmpty() {
        return (this.readdirSync().length === 0);
    }

    //returns the names of items inside directory, absolute set to true to obtain full paths
    async readdir(absolute = false) {
        const dir = this;
        const items = await util.promisify(fs.readdir)(dir.location);
        if (absolute)
            return items.map(file => path.join(dir.location, file));
        return items;
    }

    //synchronous version of readdir()
    readdirSync(absolute = false) {
        const dir = this;
        let items = fs.readdirSync(dir.location);
        if (absolute)
            return items.map(file => path.join(dir.location, file));
        return items;
    }

    //writes a new file into the directory
    async writeFile(fileName, data, options) {
        return util.promisify(fs.writeFile)(path.join(this.location, fileName), data, options);
    }

    //synchronous version of writeFile()
    writeFileSync(fileName, data, options) {
        return fs.writeFileSync(path.join(this.location, fileName), data, options);
    }

    //deletes a file in the directory
    async unlink(fileName) {
        return util.promisify(fs.unlink)(path.join(this.location, fileName));
    }

    //synchronous version of unlink()
    unlinkSync(fileName) {
        return fs.unlink(path.join(this.location, fileName));
    }

    //deletes all items in the directory
    empty() {
        const files = this.readdirSync(true);
        for (let file of files)
            fs.unlinkSync(file);
    }
}

//creates a manager that saves messages
//make sure the directory location passed in on instantiation is occupied by only one MessageManager
const swearjar = require('swearjar');
class MessageManager {
    constructor(location) {
        try {
            _assertExists(location);
            this._dir = new Directory(location);
            this.location = location;
        } catch (error) {
            throw new Error('Failed to instantiate TelegramMessageManager:' + error.message);
        }
    }

    //returns the number of messages stored by MessageManager
    get size() {
        return this._dir.size;
    }

    //returns true if nothing is stored by MessageManager
    get isEmpty() {
        return this._dir.isEmpty;
    }

    //stores the message adn returns a censored version of the message
    async store(message) {
        const {...toStore} = message;
        toStore.text = swearjar.censor(message.text);
        await this._dir.writeFile(message.date + '.js', JSON.stringify(toStore));
        return toStore;
    }

    //returns an array of messages stored, arranged in chronological order
    getMessages(number) {
        const dir = this._dir;
        const files = dir.readdirSync();
        const wanted = number ? files.slice(-number) : files;
        return wanted.map(fileName =>
            JSON.parse(
                fs.readFileSync(
                    path.join(dir.location, fileName))));
    }

    //async version of getMessages()
    async getMessagesAsync(number) {
        const dir = this._dir;
        const files = await dir.readdir();
        const wanted = number ? files.slice(-number) : files;
        const promises = wanted.map(async fileName =>
            JSON.parse(
                await util.promisify(fs.readFile)(
                    path.join(dir.location, fileName))));
        return Promise.all(promises);
    }

    //deletes all stored messages
    empty(number) {
        if (number) {
            const dir = this._dir;
            const files = dir.readdirSync();
            const toDiscard = number ? files.slice(number) : files;
            for (let file of toDiscard)
                dir.unlinkSync(file);
        } else {
            this._dir.empty();
        }
    }
}


//creates a manager that saves messages and downloads their respective photos to the highest resolution possible
//make sure the directory location passed in on instantiation is occupied by only one PhotoManager
class PhotoManager {
    constructor(location, bot) {
        const _m = path.join(location, '_messages');
        const _p = path.join(location, '_photos');
        try {
            assert(bot instanceof TelegramBot);
            _assertExists(location);
            _mkDirIfNotExist(_m);
            _mkDirIfNotExist(_p);
        } catch (error) {
            throw new Error('Failed to instantiate PhotoManager:' + error.message);
        }

        this.location = location;
        this.bot = bot;
        this._m = new MessageManager(_m);
        this._p = new Directory(_p);
    }

    //stores the message and downloads its associated photo at its highest resolution
    //returns a clone of the passed in message object including a .path attribute containing the absolute path of the photo
    async store(message) {
        //get maximum resolution file id
        const photo = message.photo;
        const maxRes = photo.length - 1;
        const fileId = photo[maxRes].file_id;

        //download photo to store directory
        const {...toStore} = message;
        toStore.path = await this.bot.downloadFile(fileId, this._p.location);

        //store associated message
        await this._m.store(toStore);

        return toStore;
    }

    //returns an array of the absolute paths of photos stored, arranged in chronological order
    getPhotos(number) {
        const messages = this._m.getMessages(number);
        return messages.map(message => message.path);
    }

    //async version of getPhotos()
    async getPhotosAsync(number) {
        const messages = await this._m.getMessagesAsync(number);
        return messages.map(message => message.path);
    }

    //returns an array of messages stored, arranged in chronological order
    getMessages(number) {
        return this._m.getMessages(number);
    }

    //async version of getMessages()
    getMessagesAsync(number) {
        return this._m.getMessagesAsync(number);
    }

    //deletes all stored messages, does not delete the downloaded photos
    empty(number) {
        this._m.empty(number);
    }

    //checks if there are no stored messages, does not reflect state of photos directory
    get isEmpty() {
        return this._m.isEmpty;
    }

    get size() {
        return this._m.size;
    }
}

module.exports = {
    File: File,
    JSONFile: File.JSONFile,
    Directory: Directory,
    MessageManager: MessageManager,
    PhotoManager: PhotoManager,
};
