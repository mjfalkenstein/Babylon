'use strict';

class Item {
    constructor(name = '===PLACEHOLDER ITEM NAME===',
                description = '===PLACEHOLDER ITEM DESCRIPTION==='){
        this.name = name;
        this.description = description;
        this.otherObject = null;
        this.useWithOther = null;
        this.damage = 1;
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
}

module.exports = Item;