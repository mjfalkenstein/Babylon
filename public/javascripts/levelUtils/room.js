'use strict';

let uuid = require('uuid/v1'),
    path = require('path'),
    utils = require(path.resolve('utils/utils.js')),
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
        this.liveNPCs = [];
        this.deadNPCs = [];
        this.specialCommands = new Map();
    }

    toJSON() {
        return {
            description: this.description,
            id: this.id,
            visibleItems: this.visibleItems,
            hiddenItems: this.hiddenItems,
            visible: this.visible,
            liveNPCs: this.liveNPCs
        }
    }

    getDescription() {
        let retString = this.description;
        _.forEach(this.liveNPCs, (npc) => {
            retString += '\nYou see ' + npc.name + '!';
        });
        _.forEach(this.deadNPCs, (npc) => {
            retString += '\n' + npc.deadDescription;
        });
        return retString;
    }

    handleSpecialCommands(input, player) {
        let functionObject = this.specialCommands.get(input);
        if (!functionObject) return null;
        return functionObject.callback(player);
    }

    addSpecialCommand(command, functionObject) {
        this.specialCommands.set(command.toLowerCase(), functionObject);
    }

    handleGetItem(input, player) {
        if (player.inventory.length >= player.stats.str) return 'You cannot carry anything else.';
        let bestItem = null;
        let bestSimilarity = 0.0;
        _.forEach(this.visibleItems, function (item) {
            let similarity = utils.similarity(input, item.name);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestItem = item;
                //console.log(item.name + ': ' + similarity);
            }
        });
        if (bestSimilarity > 0.25) {
            this.putItemInPlayerInventory(bestItem, player);
            return 'You picked up the ' + bestItem.name;
        } else {
            return 'Cannot find item: ' + input + '.';
        }
    }

    putItemInPlayerInventory(item, player) {
        this.removeItemFromRoom(item);
        player.inventory.push(item);
    }

    removeItemFromRoom(item) {
        let remainingItems = [];
        _.forEach(this.visibleItems, function (target) {
            if (target.name !== item.name || target.description !== item.description) {
                remainingItems.push(target);
            }
        });
        this.visibleItems = remainingItems;
        remainingItems = [];
        _.forEach(this.hiddenItems, function (target) {
            if (target.name !== item.name || target.description !== item.description) {
                remainingItems.push(target);
            }
        });
        this.hiddenItems = remainingItems;
    }

    addLiveNPCToRoom(npc) {
        this.liveNPCs.push(npc);
    }

    addDeadNPCToRoom(npc) {
        this.deadNPCs.push(npc);
    }

    removeNPCFromRoom(npc) {
        for (let i = 0; i < this.liveNPCs.length; i++) {
            if (this.liveNPCs[i].id === npc.id) {
                this.liveNPCs.splice(i, 1);
                return;
            }
        }
    }

    examineInRoom(input) {
        let tokens = input.split(' ');
        if (tokens.length > 1) {
            let target = tokens[1];
            let bestSimilarity = 0.0;
            let bestTarget = null;

            _.forEach(this.visibleItems.concat(this.liveNPCs), function (thing) {
                let similarity = Math.max(utils.similarity(target, thing.name),
                    utils.similarity(target, thing.constructor.name.toLowerCase()));
                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    bestTarget = thing;
                }
            });
            if (bestSimilarity > 0.25) {
                return bestTarget.description;
            } else {
                return null;
            }
        }
        return null;

    }
}

module.exports = Room;