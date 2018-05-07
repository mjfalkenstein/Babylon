'use strict';

let path = require('path'),
    Item = require(path.resolve('objectUtilities/item.js'));

class Key extends Item{
    constructor(name = 'Keycard',
                description = '===PLACEHOLDER KEY DESCRIPTION===') {
        super(name, description);
        this.matchingDoorCoords = [0, 0, 0, 0];
    }
}

module.exports = Key;