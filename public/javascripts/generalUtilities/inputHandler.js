'user strict';

const readline = require('readline'),
    q = require('q'),
    _ = require('lodash'),
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
                    console.log(player.floor.parseCommand(command.trim(), player));
                });
                return this.promptUserForInput(player);
            })
        });
    }
}

module.exports = InputHandler;