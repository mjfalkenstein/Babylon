'use strict';

let path = require('path'),
    _ = require('lodash'),
    uuid = require('uuid/v1'),
    enums = require(path.resolve('generalUtilities/enums.js'));

class NPC{
    constructor(other, floor = {}) {
        this.name = _.get(other, 'name', 'NPC');
        this.id = 'NPC:' + uuid();
        this.description = '===PLACEHOLDER NPC DESCRIPTION===';
        this.deadDescription = '===PLACEGOLDER DEAD NPC DESCRIPTION===';
        this.hostile = false;
        this.inventory = _.get(other, 'inventory', []);
        this.healthState = _.get(other, 'healthState', enums.HEALTH_STATES.HEALTHY);
        this.gameState = _.get(other, 'gameState', enums.GAME_STATES.IDLE);
        this.stats = _.get(other, 'stats', {
            hp: 10,
            str: 5,
            dex: 5,
            end: 5,
            sex: 'X',
            age: 'X',
            height: '1.75',
            weight: '70'
        });
        this.pos = _.get(other, 'pos', {
            x: 0,
            y: 0
        });
        this.floor = floor;
        this.weak = [];
        this.resist = [];
    }

    placeNPCOnFloor(floor, x, y) {
        this.floor = floor;
        this.pos = {x: x, y: y};
        this.floor.rooms[x][y].addLiveNPCToRoom(this);
    }
}

module.exports = NPC;