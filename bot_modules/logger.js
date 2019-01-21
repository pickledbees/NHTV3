'use strict';

const newline = '\r\n';
const fs = require('fs');

class Logger {

    constructor(file = `logfile${new Date().getTime()}.txt`) {
        this.file = file;
        try {
            fs.appendFileSync(file, 'LOG STARTED ' + new Date() + newline);
        } catch (e) {
            console.log(`Could not make log file with name ${file}`);
            throw e;
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