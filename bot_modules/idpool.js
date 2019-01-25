const fs = require('fs');
const {Directory} = require('./file_util');

class IDPool {
    constructor(location) {
        _assertExists(location);
        this._location = location;
        this._dir = new Directory(location);
    }

    get location() {
        return this._location;
    }

    get members() {
        return this._dir.readdirSync();
    }

    addToPool(id) {
        try {
            this._dir.writeFileSync(id.toString());
        } catch (e) {
            throw new Error('failed to add id ' + id + 'to pool: ' + e.message);
        }
    }

    isInPool(id) {
        try {
            return this._dir.existsSync(id.toString());
        } catch (e) {
            throw new Error('failed to check for id ' + id + e.message);
        }
    }

    removeFromPool(id) {
        try {
            if (this.isInPool(id)) this._dir.unlinkSync(id.toString());
        } catch (e) {
            throw new Error('failed to remove id ' + id + 'from pool: ' + e.message);
        }
    }

    clearPool() {
        try {
            this._dir.empty();
        } catch (e) {
            throw new Error('failed to clear pool');
        }
    }
}

function _assertExists(location) {
    if (!fs.existsSync(location))
        throw new Error(location + ' does not exist');
}

module.exports = IDPool;