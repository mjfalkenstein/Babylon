'use strict';

const path = require('path'),
    Player = require(path.resolve('objectUtilities/player.js')),
    characterCreator = require(path.resolve('generalUtilities/characterCreator.js')),
    levelCreator = require(path.resolve('fileUtilities/levelCreator.js'));

function main() {

    return levelCreator.createGame('levels').then((game) => {
        console.log(game);
        let testPlayer = new Player();
        for (let i = 0; i < game.floors.length; i++) {
            if (game.floors[i].id === game.firstFloorID) {
                return characterCreator.createCharacter(game.floors[i], testPlayer);
            }
        }
    });
}

main();