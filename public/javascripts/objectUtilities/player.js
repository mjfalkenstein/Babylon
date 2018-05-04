'use strict';

let _ = require('lodash'),
    path = require('path'),
    enums = require(path.resolve('enums.js')),
    utils = require(path.resolve('utils.js')),
    uuid = require('uuid/v1'),
    InputHandler = require(path.resolve('inputHandler.js'));

class Player {
    constructor(other, floor = {}) {
        this.name = _.get(other, 'name', 'Dade Murphy');
        this.discordUsername = _.get(other, 'discordUsername', 'Zero Cool');
        this.id = 'PLAYER:' + uuid();
        this.inventory = _.get(other, 'inventory', []);
        this.playerState = _.get(other, 'playerState', enums.PLAYER_STATES.HEALTHY);
        this.gameState = _.get(other, 'gameState', enums.GAME_STATES.IDLE);
        this.stats = _.get(other, 'stats', {
            hp: 10,
            str: 1,
            dex: 1,
            int: 1,
            sex: 'M',
            age: '18',
            height: '1.8',
            weight: '75'
        });
        this.pos = _.get(other, 'pos', {
            x: 0,
            y: 0
        });
        this.floor = floor;
    }

    placePlayerOnFloor(floor) {
        this.floor = floor;
        this.pos = {x: floor.entrance.x, y: floor.entrance.y};
        this.floor.initMapForPlayer(this);
        this.floor.setRoomVisible(this.pos.x, this.pos.y, true);
        return InputHandler.promptUserForInput(this);
    }

    parseCommand(input) {
        if (input === 'inventory') {
            if (this.inventory.length === 0) return 'You are empty-handed!';
            let retString = 'You are current carrying:\n';
            if (input.startsWith('inventory')) {
                _.forEach(this.inventory, function (item) {
                    retString += item.name + '\n';
                });
            }
            return retString.trim();
        } else if (input.startsWith('info')) {
            return this.getIDCard();
        } else if (input.startsWith('use')) {
            return this.useItem(input);
        } else if (input.startsWith('drop') || input.startsWith('leave')) {
            return this.dropItem(input);
        }
        return 'Unknown command: ' + input;
    }

    useItem(input) {
        let tokens = input.split(' ');
        let itemToUse = this.tryToSelectItem(input);
        if (typeof itemToUse === 'string') return itemToUse;
        return this.handleUseItem(itemToUse, tokens);
    }

    handleUseItem(item, tokens) {
        if (item.constructor.name === 'Key') {
            return this.handleUseKey(item, tokens);
        } else if (item.otherObject) {
            return this.handleUseItemsTogether(item);
        }
    }

    handleUseItemsTogether(item, tokens){
        let otherItemName = _.get(item, 'otherObject.constructor.name', '').toLowerCase();
        if (tokens.includes(otherItemName)) {
            return item.useWithOtherObject();
        } else {
            return item.name + ' cannot be used on ' + otherItemName + '.';
        }
    }

    handleUseKey(key, tokens) {
        let matchingFloor = key.matchingDoorCoords[0];
        let matchingDoorCoords = [key.matchingDoorCoords[1], key.matchingDoorCoords[2]];
        let matchingDoorDir = key.matchingDoorCoords[3];
        let currentWalls = this.floor.walls[this.pos.x][this.pos.y];

        if (this.floor.id !== matchingFloor) return 'Your ' + key.name + ' does not work on this floor.';
        if (matchingDoorCoords[0] !== this.pos.x || matchingDoorCoords[1] !== this.pos.y) return 'Your ' + key.name + ' does not work here.';

        if (tokens.length >= 2) {
            return this.handleOpenDoor(key, currentWalls, matchingDoorDir);
        } else {
            if (utils.getDirectionFromString(tokens[3] || "BAD DIRECTION") !== matchingDoorDir) return 'Cannot use your ' + key.name + ' in that way.';
            return this. handleOpenDoor(key, currentWalls, matchingDoorDir);
        }
    }

    handleOpenDoor(key, walls, dir) {
        if (walls[dir].state === enums.WALL_STATES.LOCKED) {
            this.floor.setWallState(this.pos.x, this.pos.y, dir, enums.WALL_STATES.UNLOCKED);
            this.removeItemFromInventory(key);
            return 'You use your ' + key.name + ' on the ' + utils.getStringFromDirection(dir) + 'ern door, unlocking it!';
        } else {
            return 'There is nothing to use your ' + key.name + ' on here.';
        }
    }

    dropItem(input) {
        let itemToDrop = this.tryToSelectItem(input);
        if (typeof itemToDrop === 'string') return itemToDrop;
        this.removeItemFromInventory(itemToDrop);
        this.floor.rooms[this.pos.x][this.pos.y].visibleItems.push(itemToDrop);
        return 'Dropped ' + itemToDrop.name + ' on the ground...';
    }

    tryToSelectItem(input) {
        let tokens = input.split(' ');
        let itemToUse = null;
        if (tokens.length < 2) return 'Please specify what to use.';
        for (let i = 0; i < this.inventory.length; i++) {
            let item = this.inventory[i];
            if (item.name.toLowerCase() === tokens[1].toLowerCase()) {
                itemToUse = item;
                break;
            }
        }
        if (itemToUse === null) {
            let retString = 'You are not carrying a';
            if (tokens[1].startsWith('^[aeyiuo]+$')) retString += 'n';
            return retString + ' ' + tokens[1];
        }

        return itemToUse;
    }

    removeItemFromInventory(item) {
        let remainingItems = [];
        _.forEach(this.inventory, function(target) {
            if (target.name !== item.name || target.description !== item.description) {
                remainingItems.push(target);
            }
        });
        this.inventory = remainingItems;
    }

    getIDCard() {
        let width = 45;
        let retString = '┏' + ('━'.repeat(width - 2)) + '┓\n';
        retString +=    '┃ NAME: '     + utils.formatStringToGivenLength(this.name, width - 10) + ' ┃\n';
        retString +=    '┃ ALIAS: '    + utils.formatStringToGivenLength(this.discordUsername, width - 11) + ' ┃\n';
        retString +=    '┃ ID: '       + utils.formatStringToGivenLength(this.id.replace('PLAYER:', ''), width - 8) + ' ┃\n';
        retString +=    '┃ ┏'          + ('━'.repeat(width - 6)) + '┓ ┃\n';
        retString +=    '┃ ┃    SEX: ' + utils.formatStringToGivenLength(this.stats.sex, width - 38);
        retString +=    ' HP: '    + utils.formatStringToGivenLength(this.stats.hp, width - 27) + '┃ ┃\n';
        retString +=    '┃ ┃    AGE: ' + utils.formatStringToGivenLength(this.stats.age, width - 38);
        retString +=    'STR: '    + utils.formatStringToGivenLength(this.stats.str, width - 27) + '┃ ┃\n';
        retString +=    '┃ ┃ HEIGHT: ' + utils.formatStringToGivenLength(this.stats.height + 'M', width - 38);
        retString +=    'DEX: '    + utils.formatStringToGivenLength(this.stats.dex, width - 27) + '┃ ┃\n';
        retString +=    '┃ ┃ WEIGHT: ' + utils.formatStringToGivenLength(this.stats.weight + 'KG', width - 38);
        retString +=    'INT: '    + utils.formatStringToGivenLength(this.stats.int, width - 27) + '┃ ┃\n';
        retString +=    '┃ ┗' + ('━'.repeat(width - 6)) + '┛ ┃\n';
        retString +=    '┗' + ('━'.repeat(width - 2)) + '┛\n';

        return retString;
    }

    toJSON() {
        return {
            name: this.name,
            discordUsername: this.discordUsername,
            id: this.id,
            inventory: this.inventory,
            state: this.playerState,
            stats: this.stats,
            pos: this.pos,
            floor: this.floor
        }
    }
}

module.exports = Player;