'user strict';

const readline = require('readline'),
    q = require('q'),
    _ = require('lodash'),
    nlp = require('compromise'),
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
                    // let parsedData = this.retrieveSubjectVerbObject(command.trim());
                    // console.log(this.parseCommand(parsedData.subject,
                    //     parsedData.verb, parsedData.object, player));
                    console.log(this.handleFloorCommands(command, player));
                });
                return this.promptUserForInput(player);
            })
        });
    }

    static retrieveSubjectVerbObject(input) {
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
        } else {
            parsedData.direct = nouns[0].noun;
        }

        return parsedData;
    }


    static handleFloorCommands(input, player) {
        let response = this.handlePrintMap(input, player);
        if (response) {
            return response;
        } else {
            return this.handleRoomCommands(input, player);
        }
    }

    static handlePrintMap(input, player) {
        if (input === 'map') {
            return player.floor.getFloorMap(player);
        } else if (player.pos.x === player.floor.exit.x && player.pos.y === player.floor.exit.y) {
            return player.floor.handleExit(input, player);
        } else {
            return player.floor.handleDirectionalInput(input, player);
        }
    }

    static handleRoomCommands(input, player) {
        if (input.startsWith('examine') || input.startsWith('look') || input.startsWith('search')){
            if (input.split(' ').length > 1) {
                return this.handlePlayerCommands(input, player);
            }
            let retString = player.floor.rooms[player.pos.x][player.pos.y].description + '\n';
            _.forEach(player.floor.rooms[player.pos.x][player.pos.y].visibleItems, function(item) {
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