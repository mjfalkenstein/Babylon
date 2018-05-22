'user strict';

const q = require('q'),
    _ = require('lodash'),
    nlp = require('compromise'),
    path = require('path'),
    mongoose = require('mongoose'),
    levelCreator = require(path.resolve('fileUtils/levelCreator.js')),
    Player = require(path.resolve('objects/player.js')),
    combatHandler = require(path.resolve('utils/combatHandler.js')),
    characterCreator = require(path.resolve('utils/characterCreator.js')),
    enums = require(path.resolve('utils/enums.js')),
    Game = mongoose.model('Game', {
        _id: {type: String},
        player: {type: String},
        floor: {type: String}
    });

class InputHandler {
    static parsePlayerInput(player, msg, firstFloor) {
        let input = msg.trimmedMessage.toLowerCase();
        let defer = q.defer();
        if (input && input.length > 0) {
            if (input === 'help') {
                return {'player': player, 'message': this.getHelpMessage()};
            }
            if (!player && input !== 'create') {
                return {
                    'player': player, 'message': 'You have not created a player yet.\n' +
                    'Use \'!create\' to create a new player.'
                };
            }
            if (player && player.gameState === enums.GAME_STATES.GAME_DONE && input !== 'create') {
                return {'player': player, 'message': this.gameBeatenMessage()};
            }
            if (player && player.healthState === enums.HEALTH_STATES.DEAD && input !== 'create') {
                return {'player': player, 'message': this.playerDeadMessage()};
            }
            if (player) console.log(player.discordUsername + ' (' + player.id + ') entered "' + input + '"');
            if (input.toLowerCase().startsWith('create') || player.creationState !== 'done') {
                if (input.toLowerCase().startsWith('create')) {
                    player = new Player();
                    player.id = msg.author.id;
                }
                let returnObject = {};
                defer.resolve(characterCreator.createCharacter(firstFloor, msg, player).then((results) => {
                    returnObject = results;
                    return this.save(results.player);
                }).then(() => {
                    return returnObject;
                }));
            }
            else {
                let commands = input.split('.');
                _.forEach(commands, (command) => {
                    this.handleCombatCommands(command, this.parseCommand(command), player).then((resultMessage) => {
                        defer.resolve({'message': resultMessage, 'player': player});
                    });
                });
            }
        }
        return defer.promise;
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
        let defer = q.defer();
        if (!player) return 'You\'re dead!\nUse \'!load\' to load a previous save.';
        let targetNPC = this.getTargetNPC(player, parsedInputData);
        if (targetNPC) {
            player.gameState = enums.GAME_STATES.COMBAT;
            defer.resolve(combatHandler.resolveCombatOutcome(player, targetNPC, parsedInputData));
        } else {
            player.gameState = enums.GAME_STATES.IDLE;
            defer.resolve(this.handleFloorCommands(input, player));
        }

        return defer.promise;
    }

    static getTargetNPC(player, parsedInputData) {
        let directObject = parsedInputData.direct.toLowerCase();
        let verb = parsedInputData.mainVerb.toLowerCase();
        let currentRoom = player.floor.rooms[player.pos.x][player.pos.y];
        if (verb !== 'use' && verb !== 'attack' && verb !== 'hit' && verb !== 'shoot') return null;

        for (let i = 0; i < currentRoom.liveNPCs.length; i++) {
            let npc = currentRoom.liveNPCs[i];
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
                let retString = player.floor.rooms[player.pos.x][player.pos.y].examineInRoom(input);
                return retString ? retString : this.handlePlayerCommands(input, player);
            }
            let retString = player.floor.rooms[player.pos.x][player.pos.y].getDescription();
            _.forEach(player.floor.rooms[player.pos.x][player.pos.y].visibleItems, function (item) {
                retString += '\nYou see ' + item.description + '.';
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

    static save(player) {
        if (!player) return;
        let defer = q.defer();
        let playerData = JSON.stringify(player.toJSON());
        let floorData = player.floor ? JSON.stringify(player.floor.toJSON()) : '';
        Game.findOneAndUpdate({'_id': player.id}, {$set: {player: playerData, floor: floorData}},
            {'upsert': true}, (err) => {
                if (err) {
                    defer.reject({'message': 'Error occurred while attempting to save!\n' + err, 'player': player});
                }
                defer.resolve({'message': 'Save successful!', 'player': player});
            });
        return defer.promise;
    };

    static load(inputPlayer) {
        let defer = q.defer();
        Game.findOne({'_id': inputPlayer.id}, (err, gameData) => {
            if (err) {
                defer.reject({'message': 'Error occurred while attempting to load!\n' + err, 'player': inputPlayer});
            }
            if (gameData) {
                let parsedPlayer = JSON.parse(gameData.player);
                let newPlayer = new Player();
                newPlayer.name = parsedPlayer.name;
                newPlayer.id = parsedPlayer.id;
                newPlayer.discordUsername = parsedPlayer.discordUsername;
                newPlayer.healthState = parsedPlayer.healthState;
                newPlayer.gameState = parsedPlayer.gameState;
                newPlayer.stats = parsedPlayer.stats;
                newPlayer.pos = parsedPlayer.pos;
                newPlayer.weak = parsedPlayer.weak;
                newPlayer.resist = parsedPlayer.resist;
                newPlayer.creationState = parsedPlayer.creationState;
                levelCreator.parseItemData(null, parsedPlayer.inventory, newPlayer); //load player inventory

                if (gameData.floor) {
                    let parsedFloor = JSON.parse(gameData.floor);
                    let newFloor = levelCreator.createFloorFromJSON(parsedFloor);
                    _.forEach(parsedFloor.visibleRooms, (coords) => {
                        newFloor.setRoomVisible(coords.x, coords.y, true);
                    });
                    newFloor.initMapForPlayer(newPlayer);
                    newFloor.setRoomVisible(newPlayer.pos.x, newPlayer.pos.y, true);
                    newPlayer.floor = newFloor;
                }

                defer.resolve({'message': 'Load successful!', 'player': newPlayer});
            } else {
                defer.resolve({
                    'player': null, 'message': 'You have not created a player yet.\n' +
                    'Use \'-load\' to load an existing player, or \'-create\' to create a new player.'
                });
            }
        });

        return defer.promise;
    }

    static gameBeatenMessage() {
        let retString =  '```┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n';
        retString +=        '┃ You have reached the exit of the final floor! ┃\n';
        retString +=        '┃             Thanks for playing!               ┃\n';
        retString +=        '┃     You may use \'!create\' to create a new     ┃\n';
        retString +=        '┃           character at any time.              ┃\n';
        retString +=        '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛```\n';
        return retString;
    }

    static playerDeadMessage() {
        let retString =  '```┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n';
        retString +=        '┃               You have died.                  ┃\n';
        retString +=        '┃     You may use \'!create\' to create a new     ┃\n';
        retString +=        '┃           character at any time.              ┃\n';
        retString +=        '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛```\n';
        return retString;
    }

    static getHelpMessage() {
        let retString =  '```┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n';
        retString +=        '┃ Command    ┃ Description                         ┃\n';
        retString +=        '┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃\n';
        retString +=        '┃ !create    ┃ create a new character. START HERE  ┃\n';
        retString +=        '┃ ==== THIS WILL DELETE YOUR CURRENT PROGRESS ==== ┃\n';
        retString +=        '┃ !look      ┃ look around the room you\'re in.     ┃\n';
        retString +=        '┃     note:  ┃ \'examine\' or \'search\' work too!     ┃\n';
        retString +=        '┃ !info      ┃ glance at your ID card.             ┃\n';
        retString +=        '┃ !attack    ┃ attack something (with something).  ┃\n';
        retString +=        '┃     ex:    ┃ \'!attack robot with stunprod\'       ┃\n';
        retString +=        '┃ !use       ┃ use an item (with something).       ┃\n';
        retString +=        '┃     ex:    ┃ \'!use keycard on door\'              ┃\n';
        retString +=        '┃ !map       ┃ glance at your auto-generated map.  ┃\n';
        retString +=        '┃ !north     ┃ move north (or south/east/west).    ┃\n';
        retString +=        '┃     note:  ┃ \'n\' or \'up\' work too!               ┃\n';
        retString +=        '┃ !stairs    ┃ take the stairs to the next level.  ┃\n';
        retString +=        '┃ !get       ┃ try to pick up something you see.   ┃\n';
        retString +=        '┃     note:  ┃ \'take\' or \'grab\' work too!          ┃\n';
        retString +=        '┃ !drop      ┃ drop an item that you\'re carrying.  ┃\n';
        retString +=        '┃     note:  ┃ \'leave\' works too!                  ┃\n';
        retString +=        '┃ !inventory ┃ look at what you\'re carrying.       ┃\n';
        retString +=        '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n';
        retString +=        '┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n';
        retString +=        '┃ Map Legend                                       ┃\n';
        retString +=        '┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃\n';
        retString +=        '┃ ██████░░░░░░░░░ ┃ ░ - unexplored darkness        ┃\n';
        retString +=        '┃ █   S█░░░░░░░░░ ┃ █ - impassable wall            ┃\n';
        retString +=        '┃ █ ████░░░░░░░░░ ┃ D - locked door                ┃\n';
        retString +=        '┃ █ █████D█░░░░░░ ┃ @ - you!                       ┃\n';
        retString +=        '┃ █      @ ░░░░░░ ┃ S - stairs to the next floor   ┃\n';
        retString +=        '┃ ████ ██ █░░░░░░ ┃                                ┃\n';
        retString +=        '┃ ░░░░░░░░░░░░░░░ ┃                                ┃\n';
        retString +=        '┃ ░░░░░░░░░░░░░░░ ┃                                ┃\n';
        retString +=        '┃ ░░░░░░░░░░░░░░░ ┃                                ┃\n';
        retString +=        '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n```';
        return retString;
    }
}

module.exports = InputHandler;