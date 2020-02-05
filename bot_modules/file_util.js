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
        //_assertExists(location);
        _mkDirIfNotExist(location);
        this.location = location;
    }

    //returns number of items in directory
    get size() {
        return fs.readdirSync(this.location).length;
    }

    //returns true if there is nothing in the directory, false otherwise
    get isEmpty() {
        return (this.size === 0);
    }

    //returns the names of items inside directory, absolute set to true to obtain full paths
    async readdir(absolute = false) {
        const dir = this;
        const items = await util.promisify(fs.readdir)(dir.location);
        if (absolute)
            return items.map(file => path.join(dir.location, file));
        return items;
    }

    //writes a new file into the directory
    async writeFile(fileName, data, options) {
        return util.promisify(fs.writeFile)(path.join(this.location, fileName), data, options);
    }

    //deletes a file in the directory
    async unlink(fileName) {
        return util.promisify(fs.unlink)(path.join(this.location, fileName));
    }

    async exists(fileName) {
        return fs.existsSync(path.join(this.location, fileName));
    }

    //deletes all items in the directory
    async empty(number) {
        const files = await this.readdir(true);
        if (number === undefined) {
            for (let file of files)
                fs.unlinkSync(file);
        } else {
            for (let file of files.slice(number))
                fs.unlinkSync(file);
        }
    }

    //backup
}

//creates a manager that saves messages
//make sure the directory location passed in on instantiation is occupied by only one MessageManager
const swearjar = require('swearjar');
class MessageManager {
    constructor(location) {
        try {
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

    //stores the message and returns a censored version of the message
    async store(message) {
        const {...toStore} = message;
        toStore.text = swearjar.censor(message.text);
        await this._dir.writeFile(message.date + '.js', JSON.stringify(toStore));
        return toStore;
    }

    //returns an Promise resolved to array of messages stored, arranged in chronological order
    async getMessages(number) {
        const dir = this._dir;
        const files = await dir.readdir();
        const wanted = number ? files.slice(-number) : files;
        const promises = wanted.map(async fileName =>
            JSON.parse(
                await util.promisify(fs.readFile)(
                    path.join(dir.location, fileName))));
        return Promise.all(promises);
    }

    //deletes stored messages, if number supplied, that number of messages is deleted (from earliest)
    async empty(number) {
        await this._dir.empty(number);
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
    //returns a clone of the passed in message object including a .photo attribute containing base64 encoded image string
    async store(message) {
        //get maximum resolution file id
        const photo = message.photo;
        const maxRes = photo.length - 1;
        const fileId = photo[maxRes].file_id;

        //download photo to store directory
        const {...toStore} = message;

        //TODO: find a way to abstract away from using fs here
        const path = await this.bot.downloadFile(fileId, this._p.location);
        toStore.photo = 'data:image/jpeg;base64,' + (await util.promisify(fs.readFile)(path)).toString('base64');
        toStore.caption = swearjar.censor(toStore.caption);

        //store associated message
        await this._m.store(toStore);
        return toStore;
    }

    //returns a Promise that resolves into an array of the base64 encoded images strings of photos stored, arranged in chronological order
    async getPhotos(number) {
        const messages = await this._m.getMessages(number);
        return messages.map(message => message.photo);
    }

    //returns a Promise that resolves to an array of messages stored, arranged in chronological order
    getMessages(number) {
        return this._m.getMessages(number);
    }

    //deletes all stored messages, does not delete the downloaded photos
    async empty(number) {
        await this._m.empty(number);
    }

    //checks if there are no stored messages, does not reflect state of photos directory
    get isEmpty() {
        return this._m.isEmpty;
    }

    //flushes the entire manager, removing all stored content, including images
    async flush() {
        await this._m.empty();
        await this._p.empty();
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
