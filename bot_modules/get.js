'use strict';

const https = require('https');

module.exports = function (url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                resolve(data)
            });
        }).on('error', reject);
    });
};