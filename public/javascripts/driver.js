'use strict';

const path = require('path'),
    discordUtilities = require(path.resolve('discordUtils/discordUtilities')),
    levelCreator = require(path.resolve('fileUtils/levelCreator.js'));

function main() {
    return levelCreator.createGame('levels').then((game) => {
        for (let i = 0; i < game.floors.length; i++) {
            if (game.floors[i].id === game.firstFloorID) {
                return discordUtilities.init(game.floors[i]);
            }
        }
        throw new Error('No first level defined');
    }).catch((err) => console.log(err));
}

main();