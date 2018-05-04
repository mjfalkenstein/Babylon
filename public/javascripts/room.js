'use strict';

let uuid = require('uuid/v1'),
    _ = require('lodash');

class Room {
    constructor(description = '===PLACEHOLDER ROOM DESCRIPTION===',
                visibleItems = [],
                hiddenItems = []) {
        this.description = description;
        this.id = 'ROOM:' + uuid();
        this.visibleItems = visibleItems;
        this.hiddenItems = hiddenItems;
        this.visible = false;
        this.players = [];
        this.specialCommands = [];
    }

    toJSON() {
        return {
            description: this.description,
            id: this.id,
            visibleItems: this.visibleItems,
            hiddenItems: this.hiddenItems,
            visible: this.visible,
            players: this.players
        }
    }

    parseCommand(input, player) {
        if (input === 'examine' || input === 'look' || input === 'search') {
            let retString = this.description + '\n';
            _.forEach(this.visibleItems, function(item) {
                retString += item.name + '\n';
            });
            return retString.trim();
        } else if (input.startsWith('pick up') || input.startsWith('get') || input.startsWith('grab')) {
            input = input.replace('pick up', '').replace('get', '').replace('grab', '');
            return this.handleGetItem(input, player);
        } else if (this.handleSpecialCommands(input)) {
            /* Do nothing, logic is handled in above line */
        } else {
            return player.parseCommand(input);
        }
    }

    handleSpecialCommands(input) {
        _.forEach(this.specialCommands, function(specialCommand) {
            if (specialCommand.command.toLowerCase() === input) {
                return specialCommand.callBack();
            }
        });
        return null;
    }

    handleGetItem(input, player) {
        let bestItem = null;
        let bestSimilarity = 0.0;
        _.forEach(this.visibleItems, function(item) {
            let similarity = item.similarity(input);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestItem = item;
                console.log(item.name + ': ' + similarity);
            }
        });
        if (bestSimilarity > 0.25) {
            this.putItemInPlayerInventory(bestItem, player);
            return 'You picked up the ' + bestItem.name;
        } else {
            return 'Cannot find item' + input + '.';
        }
    }

    putItemInPlayerInventory(item, player) {
        this. removeItemFromRoom(item);
        player.inventory.push(item);
    }

    removeItemFromRoom(item) {
        let remainingItems = [];
        _.forEach(this.visibleItems, function(target) {
            if (target.name !== item.name || target.description !== item.description) {
                remainingItems.push(target);
            }
        });
        this.visibleItems = remainingItems;
        remainingItems = [];
        _.forEach(this.hiddenItems, function(target) {
            if (target.name !== item.name || target.description !== item.description) {
                remainingItems.push(target);
            }
        });
        this.hiddenItems = remainingItems;
    }
}

module.exports = Room;