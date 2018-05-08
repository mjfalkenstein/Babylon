'use strict';

let path = require('path'),
    Item = require(path.resolve('objectUtilities/item.js'));

class dataslate extends Item{
    constructor(name = 'Dataslate',
                description = 'This is your personal dataslate :)') {
        super(name, description);
        this.locked = true;
    }

    getDescription() {
        if (this.locked) {
            return 'The dataslate is locked, you cannot access its contents.';
        }
        return this.description;
    }

    setDescription(newDesc) {
        if (this.locked) {
            return 'The dataslate is locked, you cannot access its contents.';
        }
        this.description = newDesc;
        return 'You enter in the new data and save the contents.';
    }
}

module.exports = dataslate;