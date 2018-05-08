'user strict';

const readline = require('readline'),
    q = require('q'),
    _ = require('lodash'),
    nlp = require('compromise'),
    path = require('path'),
    combatHandler = require(path.resolve('generalUtilities/combatHandler.js')),
    enums = require(path.resolve('generalUtilities/enums.js')),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

class InputHandler {
    static promptUserForInput(player) {
        return q.when().then(() => {
            rl.question('>', (input) => {
                input = input.toLowerCase().trim();
                console.log(player.name + ' entered "' + input + '"');
                if (input === 'exit') {
                    rl.close();
                    throw 'Exiting...';
                }
                let commands = input.split('.');
                _.forEach(commands, (command) => {
                    console.log(this.handleCombatCommands(command, this.parseCommand(command), player));
                });
                return this.promptUserForInput(player);
            })
        });
    }

    static parseCommand(input) {
        let parsedData = {
            direct: '',
            mainVerb: '',
            indirect: '',
            participle: '',
        };

        let parsedInput = nlp(input);
        let verbIndex = 0;
        let nouns = [];

        for (let i = 0; i < parsedInput.list[0].terms.length; i++) {
            let term = parsedInput.list[0].terms[i];
            let tags = Object.keys(term.tags);
            if (tags.includes('Verb')) {
                verbIndex = i;
                parsedData.mainVerb = term.normal;
            } else if (tags.includes('Preposition')) {
                parsedData.participle = term.normal;
            } else if (tags.includes('Noun')) {
                nouns.push({noun: term.normal, index: i});
            }
        }

        if (nouns.length > 1) {
            let noun1 = nouns.pop();
            let noun2 = nouns.pop();
            let difference1 = Math.abs(noun1.index - verbIndex);
            let difference2 = Math.abs(noun2.index - verbIndex);
            if (difference1 < difference2) {
                parsedData.direct = noun1.noun;
                parsedData.indirect = noun2.noun;
            } else {
                parsedData.direct = noun2.noun;
                parsedData.indirect = noun1.noun;
            }
        } else if (nouns.length === 1) {
            parsedData.direct = nouns[0].noun;
        }

        return parsedData;
    }

    static handleCombatCommands(input, parsedInputData, player) {
        let targetNPC = this.getTargetNPC(player, parsedInputData);
        if (targetNPC) {
            player.gameState = enums.GAME_STATES.COMBAT;
            return combatHandler.resolveCombatOutcome(player, targetNPC, parsedInputData);
        }
        player.gameState = enums.GAME_STATES.IDLE;
        return this.handleFloorCommands(input, player);
    }

    static getTargetNPC(player, parsedInputData) {
        let directObject = parsedInputData.direct.toLowerCase();
        let verb = parsedInputData.mainVerb.toLowerCase();
        if (verb !== 'use' && verb !== 'attack') return null;
        let currentRoom = player.floor.rooms[player.pos.x][player.pos.y];

        for (let i = 0; i < currentRoom.npcs.length; i++){
            let npc = currentRoom.npcs[i];
            if (directObject === npc.constructor.name.toLowerCase() ||
                directObject === npc.name.toLowerCase()) {
                return npc;
            }
        }
        return null;
    }

    static handleFloorCommands(input, player) {
        let retString = '';
        if (input === 'map') {
            retString = player.floor.getFloorMap(player);
        } else if (player.pos.x === player.floor.exit.x && player.pos.y === player.floor.exit.y) {
            retString = player.floor.handleExit(input, player);
        } else {
            retString = player.floor.handleDirectionalInput(input, player);
        }
        return retString || this.handleRoomCommands(input, player);
    }

    static handleRoomCommands(input, player) {
        if (input.startsWith('examine') || input.startsWith('look') || input.startsWith('search')) {
            if (input.split(' ').length > 1) {
                return this.handlePlayerCommands(input, player);
            }
            let retString = player.floor.rooms[player.pos.x][player.pos.y].description + '\n';
            _.forEach(player.floor.rooms[player.pos.x][player.pos.y].visibleItems, function (item) {
                retString += item.name + '\n';
            });
            return retString.trim();
        } else if (input.startsWith('pick up') || input.startsWith('get') || input.startsWith('grab')) {
            input = input.replace('pick up', '').replace('get', '').replace('grab', '');
            return player.floor.rooms[player.pos.x][player.pos.y].handleGetItem(input, player);
        } else if (player.floor.rooms[player.pos.x][player.pos.y].specialCommands.get(input)) {
            return player.floor.rooms[player.pos.x][player.pos.y].handleSpecialCommands(input, player)
        } else {
            return this.handlePlayerCommands(input, player);
        }
    }

    static handlePlayerCommands(input, player) {
        if (input === 'inventory') {
            if (player.inventory.length === 0) return 'You are empty-handed!';
            let retString = 'You are current carrying:\n';
            if (input.startsWith('inventory')) {
                _.forEach(player.inventory, function (item) {
                    retString += item.name + '\n';
                });
            }
            return retString.trim();
        } else if (input.startsWith('info')) {
            return player.getIDCard();
        } else if (input.startsWith('use')) {
            return player.useItem(input);
        } else if (input.startsWith('drop') || input.startsWith('leave')) {
            return player.dropItem(input);
        } else if (input.startsWith('examine') || input.startsWith('look at') || input.startsWith('read')) {
            return player.lookAtItem(input);
        }
        return 'Unknown command: ' + input;
    }
}

module.exports = InputHandler;