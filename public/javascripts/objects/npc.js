'use strict';

let path = require('path'),
    _ = require('lodash'),
    uuid = require('uuid/v1'),
    enums = require(path.resolve('utils/enums.js'));

class NPC{
    constructor(other, floor = {}) {
        this.name = _.get(other, 'name', 'NPC');
        this.id = 'NPC:' + uuid();
        this.description = '===PLACEHOLDER NPC DESCRIPTION===';
        this.deadDescription = '===PLACEGOLDER DEAD NPC DESCRIPTION===';
        this.hostile = false;
        this.alive = true;
        this.inventory = _.get(other, 'inventory', []);
        this.healthState = _.get(other, 'healthState', enums.HEALTH_STATES.HEALTHY);
        this.gameState = _.get(other, 'gameState', enums.GAME_STATES.IDLE);
        this.stats = _.get(other, 'stats', {
            hp: 10,
            str: 1,
            dex: 1,
            end: 1,
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
        if (this.stats.hp > 0) {
            this.alive = false;
            this.healthState = enums.HEALTH_STATES.DEAD;
            this.floor.rooms[x][y].addLiveNPCToRoom(this);
        } else {
            this.floor.rooms[x][y].addDeadNPCToRoom(this);
        }
    }

    toJSON() {
        let npcData = {};
        npcData.name = this.name;
        npcData.type = this.constructor.name.toLowerCase();
        npcData.id = this.id;
        npcData.description = this.description;
        npcData.deadDescription = this.deadDescription;
        npcData.hostile = this.hostile;
        npcData.healthState = this.healthState;
        npcData.gameState = this.gameState;
        npcData.stats = this.stats;
        npcData.x = this.pos.x;
        npcData.y = this.pos.y;
        npcData.floor = this.floor.id;
        npcData.inventory = [];
        npcData.weak = [];
        npcData.resist = [];
        npcData.alive = this.alive;

        _.forEach(this.inventory, (item) => {
            npcData.inventory.push(item.toJSON());
        });

        _.forEach(this.weak, (weakness) => {
            npcData.weak.push(weakness);
        });

        _.forEach(this.resist, (resist) => {
            npcData.resist.push(resist);
        });

        return npcData;
    }
}

module.exports = NPC;