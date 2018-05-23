'use strict';

let path = require('path'),
    Player = require(path.resolve('objects/player.js')),
    utils = require(path.resolve('utils/utils.js')),
    q = require('q'),
    functions = [getName, getSex, getAge, getHeight, getWeight, getStr, getDex, getEnd, confirmNewPlayer];

let getNameMessage = utils.formatStringInTextBox('Welcome, citizen. \n\nHere you will complete the first stage of ' +
    'PII entry. Below, please provide the requested data for registration and cataloging. You may find it helpful ' +
    'to have your official Government of ' +
    'Terra PII Help Booklet handy, as well as some basic health information, including height and ' +
    'weight statistics, in addition to official fitness data for strength, dexterity, and endurance (please see ' +
    'pg. 103, sec 2B of the Help Booklet for tips on gathering and maintaining your personal health records). \n\n' +
    'Please enter your full name (first last) as recorded in the Registrar of Persons. If you are ' +
    'not enrolled with the RoP, please see your local Authorized Enrollment Officer for assistance.', 52);
let getSexMessage = utils.formatStringInTextBox('Please enter your birth sex (M or F).', 52);
let getAgeMessage = utils.formatStringInTextBox('Please enter your age in standard Terran years.', 52);
let getHeightMessage = utils.formatStringInTextBox('Please enter your height in meters.', 52);
let getWeightMessage = utils.formatStringInTextBox('Please enter your weight in kilograms.', 52);
let getStrMessage = 'Please enter your desired STRENGTH. (remaining points: %s): ';
let getDexMessage = 'Please enter your desired DEXTERITY. (remaining points: %s): ';
let getEndMessage = 'Please enter your desired ENDURANCE. (remaining points: %s): ';

module.exports.createCharacter = function (floor, msg, player) {
    if (!player) {
        player = new Player();
        player.id = msg.author.id;
        player.discordUsername = msg.author.username;
    }
    let defer = q.defer();
    switch(player.creationState) {
        case 0: case 1 :case 2: case 3: case 4: case 5: case 6: case 7: case 8:
            defer.resolve({'player': player, 'message': functions[player.creationState++](msg, player, false)});
            break;
        case 9:
            if (msg.trimmedMessage.toLowerCase() === 'y' || msg.trimmedMessage.toLowerCase() === 'yes') {
                player.creationState = 'done';
                player.placePlayerOnFloor(floor);
                defer.resolve({'player': player, 'message': 'Welcome, ' + player.name + '.'});
            } else if (msg.trimmedMessage.toLowerCase() === 'back') {
                player.stats.end = 1;
                defer.resolve({'player': player, 'message': confirmNewPlayer(msg, player, true)});
            } else {
                player.creationState = 0;
                defer.resolve({'player': player, 'message': getName(msg, new Player(), false)});
            }
            break;
        default:
            player.creationState = 0;
            defer.resolve({'player': player, 'message': getName(msg, new Player(), false)});
    }
    return defer.promise;
};

function getName(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState = 0;
        return getName(msg, player, true);
    }

    return getNameMessage;
}

function getSex(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        return getName(msg, player, true);
    }
    player.name = msg.trimmedMessage;
    player.discordUsername = msg.author.username;
    return getSexMessage;
}

function getAge(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        return getSex(msg, player, true);
    }
    if (msg.trimmedMessage.toLowerCase() !== 'm' && msg.trimmedMessage.toLowerCase() !== 'f') {
        player.creationState = player.creationState > 0 ? player.creationState - 1 : 0;
        return getSexMessage;
    } else {
        player.stats.sex = msg.trimmedMessage.toUpperCase();
        return getAgeMessage;
    }
}

function getHeight(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        return getAge(msg, player, true);
    }
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage) || numValue <= 0 || numValue > 100) {
        player.creationState = player.creationState > 0 ? player.creationState - 1 : 0;
        return getAgeMessage;
    } else {
        player.stats.age = numValue;
        return getHeightMessage;
    }
}

function getWeight(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        return getHeight(msg, player, true);
    }
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage) || numValue <= 0 || numValue > 3) {
        player.creationState = player.creationState > 0 ? player.creationState - 1 : 0;
        return getHeightMessage;
    } else {
        player.stats.height = numValue;
        return getWeightMessage;
    }
}

function getStr(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        return getWeight(msg, player, true);
    }
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage) || numValue <= 0 || numValue > 200) {
        player.creationState = player.creationState > 0 ? player.creationState - 1 : 0;
        return getWeightMessage;
    } else {
        player.stats.weight = numValue;
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return utils.formatStringInTextBox(getStrMessage.replace('%s', remaining.toString()), 52);
    }
}

function getDex(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        return getStr(msg, player, true);
    }
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage)) {
        player.creationState = player.creationState > 0 ? player.creationState - 1 : 0;
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return utils.formatStringInTextBox(getStrMessage.replace('%s', remaining.toString()), 52);
    } else {
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        player.stats.str = sanitizeInputForStats(numValue, remaining);
        remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return utils.formatStringInTextBox(getDexMessage.replace('%s', remaining.toString()), 52);
    }
}

function getEnd(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        player.stats.str = 1;
        return getDex(msg, player, true);
    }
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage)) {
        player.creationState = player.creationState > 0 ? player.creationState - 1 : 0;
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return utils.formatStringInTextBox(getDexMessage.replace('%s', remaining.toString()), 52);
    } else {
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        player.stats.dex = sanitizeInputForStats(numValue, remaining);
        remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return utils.formatStringInTextBox(getEndMessage.replace('%s', remaining.toString()), 52);
    }
}

function confirmNewPlayer(msg, player, back) {
    if (msg.trimmedMessage.toLowerCase() === 'back' && !back) {
        player.creationState--;
        player.stats.dex = 1;
        return getEnd(msg, player, true);
    }
    let numValue = parseFloat(msg.trimmedMessage);
    if (isNaN(msg.trimmedMessage)) {
        player.creationState = player.creationState > 0 ? player.creationState - 1 : 0;
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        return utils.formatStringInTextBox(getEndMessage.replace('%s', remaining.toString()), 52);
    } else {
        let remaining = 15 - (player.stats.str + player.stats.dex + player.stats.end) + 1;
        player.stats.end = sanitizeInputForStats(numValue, remaining);
        player.stats.hp = player.stats.end * 2;
        return player.getIDCard() + 'Is this information correct? (y/n/back)';
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