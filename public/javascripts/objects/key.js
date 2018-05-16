'use strict';

let path = require('path'),
    Item = require(path.resolve('objects/item.js')),
    utils = require(path.resolve('utils/utils.js'));

class Key extends Item{
    constructor(name = 'Keycard',
                description = '===PLACEHOLDER KEY DESCRIPTION===') {
        super(name, description);
        this.matchingDoor = [0, 0, 0, 0];
    }

    toJSON() {
        let itemData = super.toJSON();
        itemData.matchingDoor = {
            'x': this.matchingDoor[1],
            'y': this.matchingDoor[2],
            'floorID': this.matchingDoor[0],
            'dir': utils.getStringFromDirection(this.matchingDoor[3]),
        };
        return itemData;
    }
}

module.exports = Key;