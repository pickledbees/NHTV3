var util = require("util"),
    File = require("./File");

function getIgnoreIterator(ignore) {
    if (typeof ignore === "string") {
        return function (line) {
            return line.slice(0, ignore.length) !== ignore;
        };
    } else if (ignore instanceof RegExp) {
        return function (line) {
            return !ignore.test(line);
        };
    } else if (typeof ignore === "function") {
        return function (line) {
            return !ignore(line);
        };
    } else {
        return function (line) {
            return !!line;
        }
    }
}

/**
 * Create an API for manipulating a list of entries (each on it's own line)
 *
 * @augments File
 */
function ListFile() {
    File.apply(this, arguments);
}

// inherit directly from File
util.inherits(ListFile, File);

// split each line into it's own entry in an array
ListFile.prototype.parse = function (input) {
    var filter = getIgnoreIterator(this.ignore);

    return input.trim().split(/[\r\n]+/gm).filter(function (line) {
        line = line.trim();
        return !!line ? filter(line) : false;
    });
};

// put each item on it's own line
ListFile.prototype.stringify = function (input) {
    return input.join("\n");
};

/**
 * Retrieve the line number (0-indexed) for a particular item
 *
 * @param {String} item
 * @param {Function} callback
 */
ListFile.prototype.indexOf = function (item, callback) {
    callback = callback.bind(this);

    this.read(function (err, list) {
        if (err) return callback(err);

        callback(null, list.indexOf(item), list);
    })
};

/**
 * Determine whether or not a particular item exists in the collection
 *
 * @param {String} item
 * @param {Function} callback
 */
ListFile.prototype.contains = function (item, callback) {
    callback = callback.bind(this);

    this.indexOf(item, function (err, index, list) {
        if (err) return callback(err);

        callback(null, index !== -1, list);
    });
};

/**
 * Add an item to the collection
 *
 * @param {String} item
 * @param {Function} callback
 */
// TODO: optimize with fs.appendFile ...?
ListFile.prototype.add = function (item, callback) {
    callback = callback.bind(this);

    this.read(function (err, list) {
        if (err) return callback(err);

        this.write(list.concat(item), callback);
    });
};

/**
 * Remove an item from the collection
 *
 * @param {String|Number} item  String item, or Numbered index
 * @param {Function} callback
 */
ListFile.prototype.remove = function (item, callback) {
    callback = callback.bind(this);

    if (typeof item === "string") {
        this.indexOf(item, function (err, index, list) {
            if (err) return callback(err);

            list.splice(index, 1);
            this.write(list, callback);
        });
    } else {
        this.read(function (err, list) {
            if (err) return callback(err);

            list.splice(item, 1);
            this.write(list, callback);
        });
    }
};

module.exports = ListFile;
