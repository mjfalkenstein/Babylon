'use strict';

let path = require('path'),
    uuid = require('uuid/v1'),
    enums = require(path.resolve('utils/enums.js'));

class Item {
    constructor(name = '===PLACEHOLDER ITEM NAME===',
                description = '===PLACEHOLDER ITEM DESCRIPTION==='){
        this.name = name;
        this.description = description;
        this.otherObject = null;
        this.useWithOther = null;
        this.damage = 1;
        this.type = enums.DAMAGE_TYPES.BLUNT;
        this.id = 'ITEM:' + uuid();
    }

    setOtherObject(otherObject, callback) {
        this.otherObject = otherObject;
        this.useWithOther = callback;
    }

    getDescription() {
        return this.description;
    }

    useWithOtherObject() {
        if (!this.useWithOther()) return null;
        return this.useWithOther();
    }

    toJSON() {
        return {
            'name': this.name,
            'type': this.constructor.name.toLowerCase(),
            'description': this.description,
            'otherObject': this.otherObject ? this.otherObject.id : null,
            'matchingObject': this.otherObject ? this.otherObject.id : null,
            'useWithOther': this.useWithOther ? this.useWithOther.toString() : null,
            'damage': this.damage,
            'damageType': this.type,
            'id': this.id
        }
    }
}

module.exports = Item;