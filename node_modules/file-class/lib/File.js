var fs     = require("fs"),
    path   = require("path"),
    extend = require("extend"),
    mkdirp = require("mkdirp");

/**
 * Create an object representing a single file
 *
 * Available options:
 *  - encoding:  default="utf8"
 *  - parse:     parse the file's contents (ex: JSON.parse)
 *  - stringify: convert data into the file's contents (ex: JSON.stringify)
 *
 * @param {String} location  The path to the file
 * @param {Object} options   Additional configuration
 *
 * @constructor
 */
function File(location, options) {
    this.location = location;
    extend(this, options);
}

// set up some default properties
File.prototype.encoding = "utf8";
File.prototype.parse = null;
File.prototype.stringify = null;

/**
 * Read the contents of this file. If the parse option is set, it will run the
 * function on the contents after reading.
 *
 * @param {Function} callback
 */
File.prototype.read = function (callback) {
    var file = this;
    callback = callback.bind(this);

    fs.readFile(this.location, this.encoding, function (err, contents) {
        if (err) {
            callback(err);
        } else if (file.parse) {
            callback(null, file.parse(contents));
        } else {
            callback(null, contents);
        }
    });
};

/**
 * Create the dir for this file (using mkdirp)
 *
 * @param {Function} callback
 */
File.prototype.mkdir = function (callback) {
    mkdirp(path.dirname(this.location), callback.bind(this));
};

/**
 * Write the contents parameter to the body of the file, If the stringify option
 * is set, it will run the function on the contents param before writing.
 *
 * @param {String|Buffer} contents
 * @param {Function}      callback
 */
File.prototype.write = function (contents, callback) {
    callback = callback.bind(this);

    this.mkdir(function (err) {
        if (err) return callback(err);

        if (this.stringify) {
            contents = this.stringify(contents);
        }

        fs.writeFile(this.location, contents, callback);
    });
};

/**
 * Empty the file of it's contents
 *
 * @param {Function} callback
 */
File.prototype.empty = function (callback) {
    fs.writeFile(this.location, "", callback.bind(this));
};

/**
 * Delete this file (alias: unlink/del)
 *
 * @param {Function} callback
 */
File.prototype.unlink = function (callback) {
    fs.unlink(this.location, callback.bind(this));
};

// alias
File.prototype.del = File.prototype.unlink;

/**
 * Check for the file's existence
 *
 * @param {Function} callback
 */
File.prototype.exists = function (callback) {
    fs.exists(this.location, callback.bind(this));
};

/**
 * Get a stat object for this file
 *
 * @param {Function} callback
 */
File.prototype.stat = function (callback) {
    fs.stat(this.location, callback.bind(this));
};

// TODO: include other fs functions here

module.exports = File;
