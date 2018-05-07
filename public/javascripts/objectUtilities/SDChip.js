'use strict';

let path = require('path'),
    Item = require(path.resolve('objectUtilities/item.js'));

class sdchip extends Item{
    constructor(name = 'SDChip',
                description = '===PLACEHOLDER SDChip DESCRIPTION===') {
        super(name, description);

        this.useWithOtherObject = function(player) {
            this.otherObject.locked = false;
            player.removeItemFromInventory(this);
            return 'You use the SD chip on the personal dataslate.\nThe dataslate blinks to life.';
        }
    }
}

module.exports = sdchip;