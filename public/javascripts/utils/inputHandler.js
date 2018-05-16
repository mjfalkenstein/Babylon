'user strict';

const readline = require('readline'),
    q = require('q'),
    _ = require('lodash'),
    nlp = require('compromise'),
    path = require('path'),
    mongoose = require('mongoose'),
    levelCreator = require(path.resolve('fileUtils/levelCreator.js')),
    Player = require(path.resolve('objects/player.js')),
    combatHandler = require(path.resolve('utils/combatHandler.js')),
    enums = require(path.resolve('utils/enums.js')),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    }),
    Game = mongoose.model('Game', {
        _id: {type: String},
        player: {type: String},
        floor: {type: String}
    });

class InputHandler {
    static promptUserForInput(player) {
        return this.connect('mongodb://localhost:27017/db').then(() => {
            rl.question('>', (input) => {
                if (input && input.length > 0) {
                    input = input.toLowerCase().trim();
                    if (player) console.log(player.name + ' entered "' + input + '"');
                    if (input === 'exit') {
                        rl.close();
                        throw 'Exiting...';
                    } else if (input === 'save') {
                        return this.save(player).then((result) => {
                            console.log(result.message);
                            return this.promptUserForInput(result.player);
                        })
                    } else if (input === 'load') {
                        return this.load(player).then((result) => {
                            console.log(result.message);
                            return this.promptUserForInput(result.player);
                        })
                    }
                    let commands = input.split('.');
                    _.forEach(commands, (command) => {
                        this.handleCombatCommands(command, this.parseCommand(command), player).then((outString) => {
                            console.log(outString);
                        });

                        if (player && player.healthState === enums.HEALTH_STATES.DEAD) player = null;
                    });
                }
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
                retString += '\n' + item.name;
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

    static connect(dbName) {
        return mongoose.connect(dbName);
    };

    static save(player) {
        let defer = q.defer();
        let playerData = JSON.stringify(player.toJSON());
        let floorData = JSON.stringify(player.floor.toJSON());
        Game.findOneAndUpdate({'_id': player.discordID}, {$set: {player: playerData, floor: floorData}},
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
        Game.findOne({'_id': inputPlayer.discordID}, (err, gameData) => {
            // console.log(JSON.stringify(JSON.parse(gameData.player), null, 2));
            // console.log(JSON.stringify(JSON.parse(gameData.floor), null, 2));
            if (err) {
                defer.reject({'message': 'Error occurred while attempting to load!\n' + err, 'player': inputPlayer});
            }
            let parsedFloor = JSON.parse(gameData.floor);
            let parsedPlayer = JSON.parse(gameData.player);
            let newPlayer = new Player();
            let newFloor = levelCreator.createFloorFromJSON(parsedFloor);
            newPlayer.name = parsedPlayer.name;
            newPlayer._id = parsedPlayer._id;
            newPlayer.discordUsername = parsedPlayer.discordUsername;
            newPlayer.discordID = parsedPlayer.discordID;
            newPlayer.healthState = parsedPlayer.healthState;
            newPlayer.gameState = parsedPlayer.gameState;
            newPlayer.stats = parsedPlayer.stats;
            newPlayer.pos = parsedPlayer.pos;
            newPlayer.weak = parsedPlayer.weak;
            newPlayer.resist = parsedPlayer.resist;
            newPlayer.floor = newFloor;
            levelCreator.parseItemData(null, parsedPlayer.inventory, newPlayer); //load player inventory
            newFloor.initMapForPlayer(newPlayer);
            newFloor.setRoomVisible(newPlayer.pos.x, newPlayer.pos.y, true);
            _.forEach(parsedFloor.visibleRooms, (coords) => {
                newFloor.setRoomVisible(coords.x, coords.y, true);
            });

            defer.resolve({'message': 'Load successful!', 'player': newPlayer});
        });

        return defer.promise;
    }
}

module.exports = InputHandler;