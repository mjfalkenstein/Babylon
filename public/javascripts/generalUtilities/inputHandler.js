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
                input = input.toLowerCase();
                if (input === 'exit') {
                    rl.close();
                    throw 'Exiting...';
                }
                let commands = input.split('.');
                _.forEach(commands, (command) => {
                    let parsedData = this.retrieveSubjectVerbObject(command.trim());
                    console.log(this.parseCommand(parsedData.subject,
                        parsedData.verb, parsedData.object, player));
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

    static parseCommand(subject, verb, object, player) {
        let currentFloor = player.floor;
        let currentRoom = currentFloor.rooms[player.pos.x][player.pos.y];


    }
}

module.exports = InputHandler;