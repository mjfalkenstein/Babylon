'use strict';

let path = require('path'),
    _ = require('lodash'),
    uuid = require('uuid/v1'),
    NPC = require(path.resolve('objectUtilities/npc.js'));

class Robot extends NPC{
    constructor(other, floor = {}) {
        super(other, floor);
        this.name = _.get(other, 'name', 'Unit0001');
        this.id = 'ROBOT:' + uuid();
        this.stats = _.get(other, 'stats', {
            hp: 14,
            str: 8,
            dex: 3,
            end: 7,
            sex: 'X',
            age: 'X',
            height: '2',
            weight: '200'
        });
    }
}

module.exports = Robot;