'user strict';

const readline = require('readline'),
    q = require('q'),
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
                console.log(player.floor.parseCommand(input, player));
                return this.promptUserForInput(player);
            })
        });
    }
}

module.exports = InputHandler;