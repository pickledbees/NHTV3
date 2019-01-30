'use strict';

const newline = '\r\n';
const fs = require('fs');

class Logger {

    constructor(location) {
        if (fs.existsSync(location)) {
            this.file = location;
        } else {
            throw new Error('location ' + location + ' does not exist!');
        }
    }

    log(logText, save = true) {
        if (save) {
            let file = this.file;
            let status;
            try {
                fs.appendFileSync(file, logText + newline);
                status = `logged to ${file}`;
            } catch (e) {
                status = `failed to log to ${file}`;
                throw e;
            }
            console.log(`${logText} | ${status}`);
        } else {
            console.log(logText);
        }
    }
}

module.exports = Logger;