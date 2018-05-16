'use strict';

const path = require('path'),
    Player = require(path.resolve('objects/player.js')),
    characterCreator = require(path.resolve('utils/characterCreator.js')),
    inputHandler = require(path.resolve('utils/inputHandler.js')),
    levelCreator = require(path.resolve('fileUtils/levelCreator.js'));

function main() {
    return levelCreator.createGame('levels').then((game) => {
        let testPlayer = new Player();
        for (let i = 0; i < game.floors.length; i++) {
            if (game.floors[i].id === game.firstFloorID) {
                return characterCreator.createCharacter(game.floors[i], testPlayer).then((newPlayer) => {
                    return inputHandler.promptUserForInput(newPlayer);
                });
            }
        }
        throw new Error('No first level defined');
    }).catch((err) => console.log(err));
}

main();