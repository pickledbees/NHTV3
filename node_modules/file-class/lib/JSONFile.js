var util   = require("util"),
    extend = require("extend"),
    File   = require("./File");

/**
 * Create an API for reading/writing JSON to a file
 *
 * Additional options:
 *  - replacer {Function} for JSON.stringify (arg 2)
 *  - spaces   {Number}   for JSON.stringify (arg 3)
 *
 * @augments File
 */
function JSONFile() {
    File.apply(this, arguments);
}

// inherit directly from File
util.inherits(JSONFile, File);

// direct copy of JSON.parse
JSONFile.prototype.parse = JSON.parse;

// allow for the other params to be bound via properties on this
JSONFile.prototype.stringify = function (input) {
    return JSON.stringify(input, this.replacer || null, this.spaces || null);
};

/**
 * Read the existing file, merge the input data, and write it back
 *
 * @param {Object} data
 * @param {Function} callback
 */
JSONFile.prototype.merge = function (data, callback) {
    callback = callback.bind(this);

    this.read(function (err, contents) {
        if (err) return callback(err);

        extend(contents, data);

        this.write(contents, function (err) {
            if (err) return callback(err);

            callback(null, contents);
        });
    });
};

module.exports = JSONFile;
