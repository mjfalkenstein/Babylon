'use strict';

let path = require('path'),
    enums = require(path.resolve('utils/enums.js')),
    Item = require(path.resolve('objects/item.js'));

class Stunprod extends Item{
    constructor(name = 'Stunprod',
                description = '===PLACEHOLDER STUNPROD DESCRIPTION===') {
        super(name, description);
        this.damage = 2;
        this.type = enums.DAMAGE_TYPES.SHOCK;
    }
}

module.exports = Stunprod;