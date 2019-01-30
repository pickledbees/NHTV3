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

    getMembers() {
        return this._dir.readdir();
    }

    addToPool(id) {
        try {
            return this._dir.writeFile(id.toString());
        } catch (e) {
            throw new Error('failed to add id ' + id + 'to pool: ' + e.message);
        }
    }

    isInPool(id) {
        try {
            return this._dir.exists(id.toString());
        } catch (e) {
            throw new Error('failed to check for id ' + id + e.message);
        }
    }

    async removeFromPool(id) {
        try {
            if (await this.isInPool(id))
                return this._dir.unlink(id.toString());
        } catch (e) {
            throw new Error('failed to remove id ' + id + 'from pool: ' + e.message);
        }
    }

    clearPool() {
        try {
            return this._dir.empty();
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