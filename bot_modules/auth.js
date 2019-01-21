const fs = require('fs');
const {Directory} = require('./file_util');
const assert = require('assert');

class Auth {
    constructor(location) {
        if (!fs.existsSync(location))
            throw new Error(location + ' does not exist');
        this._dir = new Directory(location);
        this.location = location;

    }

    getPasses() {

    }
}