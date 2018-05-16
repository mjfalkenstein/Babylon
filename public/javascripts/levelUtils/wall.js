'use strict';

let path = require('path'),
    enums = require(path.resolve('utils/enums.js'));

class Wall {
    constructor(description = "===PLACEHOLDER WALL DESCRIPTION===",
                state = enums.WALL_STATES.WALL) {
        this.description = description;
        this.state = state;
    }

    toJSON() {
        return {
            description: this.description,
            state: this.state
        };
    }
}

module.exports = Wall;