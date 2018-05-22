'use strict';

let path = require('path'),
    Player = require(path.resolve('objects/player.js')),
    q = require('q');

module.exports.createCharacter = function (floor, msg, player) {
    if (!player) {
        player = new Player();
        player.id = msg.author.id;
        player.discordUsername = msg.author.username;
    }
    let defer = q.defer();
    switch(player.creationState) {
        case 0:
            player.creationState++;
            defer.resolve({'player': player, 'message': getName(msg, player)});
            break;
        case 1:
            player.creationState++;
            defer.resolve({'player': player, 'message': getSex(msg, player)});
            break;
        case 2:
            player.creationState++;
            defer.resolve({'player': player, 'message': getAge(msg, player)});
            break;
        case 3:
            player.creationState++;
            defer.resolve({'player': player, 'message': getHeight(msg, player)});
            break;
        case 4:
            player.creationState++;
            defer.resolve({'player': player, 'message': getWeight(msg, player)});
            break;
        case 5:
            player.creationState++;
            defer.resolve({'player': player, 'message': getStr(msg, player)});
            break;
        case 6:
            player.creationState++;
            defer.resolve({'player': player, 'message': getDex(msg, player)});
            break;
        case 7:
            player.creationState++;
            defer.resolve({'player': player, 'message': getEnd(msg, player)});
            break;
        case 8:
            player.creationState++;
            defer.resolve({'player': player, 'message': confirmNewPlayer(msg, player)});
            break;
        case 9:
            if (msg.trimmedMessage.toLowerCase() === 'y') {
                player.creationState = 'done';
                player.placePlayerOnFloor(floor);
                defer.resolve({'player': player, 'message': 'Welcome, ' + player.name});
            } else {
                player.creationState = 1;
                defer.resolve(getName(msg, new Player()));
            }
    }
    return defer.promise;
};

function getName(msg, player) {
    return 'Please enter your full name (first last) as recorded in the Registrar of Persons.\n' +
        'If you have not been enrolled with the RoP, \n' +
        'please see your Enrollment Officer for assistance: ';
}

function getSex(msg, player) {
    player.name = msg.trimmedMessage;
    player.discordUsername = msg.author.username;
    return 'Please enter your birth sex (M or F): ';
}

function getAge(msg, player) {
    if (msg.trimmedMessage.toLowerCase() !== 'm' && msg.trimmedMessage.toLowerCase() !== 'f') {
        player.creationState = 1;
        return '===INVALID INPUT===\n' + getName();
    } else {
        player.stats.sex = msg.trimmedMessage.toUpperCase();
        return 'Please enter your age in standard Earth years: ';
    }
}

function getHeight(msg, player) {
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage) || numValue <= 0 || numValue > 100) {
        player.creationState = 1;
        return '===INVALID INPUT===\n' + getName();
    } else {
        player.stats.age = numValue;
        return 'Please enter your height in meters: ';
    }
}

function getWeight(msg, player) {
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage) || numValue <= 0 || numValue > 3) {
        player.creationState = 1;
        return '===INVALID INPUT===\n' + getName();
    } else {
        player.stats.height = numValue;
        return 'Please enter your weight in kilograms: ';
    }
}

function getStr(msg, player) {
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage) || numValue <= 0 || numValue > 200) {
        player.creationState = 1;
        return '===INVALID INPUT===\n' + getName();
    } else {
        player.stats.weight = numValue;
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return 'Please enter your desired STRENGTH (1 - ' + remaining + '): ';
    }
}

function getDex(msg, player) {
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage)) {
        player.creationState = 1;
        return '===INVALID INPUT===\n' + getName();
    } else {
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        player.stats.str = sanitizeInputForStats(numValue, remaining);
        remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return 'Please enter your desired DEXTERITY (1 - ' + remaining + '): ';
    }
}

function getEnd(msg, player) {
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage)) {
        player.creationState = 1;
        return '===INVALID INPUT===\n' + getName();
    } else {
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        player.stats.dex = sanitizeInputForStats(numValue, remaining);
        remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return 'Please enter your desired ENDURANCE (1 - ' + remaining + '): ';
    }
}

function confirmNewPlayer(msg, player) {
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage)) {
        player.creationState = 1;
        return '===INVALID INPUT===\n' + getName();
    } else {
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        player.stats.end = sanitizeInputForStats(numValue, remaining);
        player.stats.hp = player.stats.end * 2;
        return player.getIDCard() + 'Is this information correct? (y/n)? ';
    }
}

function sanitizeInputForStats(input, remaining) {
    let result = parseInt(input);
    if (isNaN(result) || result <= 1) {
        return 1;
    } else if (result >= remaining) {
        return remaining;
    }
    return result;
}