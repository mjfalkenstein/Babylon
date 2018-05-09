'use strict';

let path = require('path'),
    _ = require('lodash'),
    uuid = require('uuid/v1'),
    enums = require(path.resolve('generalUtilities/enums.js')),
    NPC = require(path.resolve('objectUtilities/npc.js'));

class Robot extends NPC{
    constructor(other, floor = {}) {
        super(other, floor);
        this.description = '===PLACEHOLDER ROBOT DESCRIPTION===';
        this.deadDescription = '===PLACEHOLDER DEAD ROBOT DESCRIPTION===';
        this.name = _.get(other, 'name', 'Unit0001');
        this.id = 'ROBOT:' + uuid();
        this.hostile = true;
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
        this.weak = [
            enums.DAMAGE_TYPES.SHOCK
        ];
        this.resist = [
            enums.DAMAGE_TYPES.BLUNT,
            enums.DAMAGE_TYPES.SLASH
        ]
    }
}

module.exports = Robot;