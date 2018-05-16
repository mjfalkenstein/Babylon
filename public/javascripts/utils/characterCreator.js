'use strict';

let path = require('path'),
    Player = require(path.resolve('objects/player.js')),
    q = require('q'),
    readline = require('readline'),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

module.exports.createCharacter = function (floor, player) {
    if (player) {
        let defer = q.defer();
        player.placePlayerOnFloor(floor);
        defer.resolve(player);
        return defer.promise;
    }
    let newPlayer = new Player();
    return getName().then((name) => {
        newPlayer.name = name;
        return getAlias();
    }).then((alias) => {
        newPlayer.discordUsername = alias;
        return getSex();
    }).then((sex) => {
        newPlayer.stats.sex = sex;
        return getAge();
    }).then((age) => {
        newPlayer.stats.age = age;
        return getHeight();
    }).then((height) => {
        newPlayer.stats.height = height;
        return getWeight();
    }).then((weight) => {
        newPlayer.stats.weight = weight;
        return allocateStats();
    }).then((stats) => {
        Object.keys(stats).forEach((key) => newPlayer.stats[key] = stats[key]);
        newPlayer.stats.hp = newPlayer.stats.end * 2;
        return confirmNewPlayer(newPlayer);
    }).then((result) => {
        if (result === 'done') {
            newPlayer.placePlayerOnFloor(floor);
            return newPlayer;
        }
        return module.exports.createCharacter(floor);
    }).catch((err) => {
        console.log('\n' + err);
        return module.exports.createCharacter(floor);
    });
};

function getName() {
    let defer = q.defer();
    rl.question('Please enter your full name (first last) as recorded in the Registrar of Persons.\n' +
        'If you have not been enrolled with the RoP, \n' +
        'please see your Enrollment Officer for assistance: ', (input) => {
        if (input.length === 0) return 'Dade Murphy';
        defer.resolve(input);
    });
    return defer.promise;
}

function getAlias() {
    /* Gonna need to grab this from discord, for now just return placeholder */
    return 'Zero Cool';
}

function getSex() {
    let defer = q.defer();
    rl.question('Please enter your birth sex (M or F): ', (input) => {
        if (input.toLowerCase() !== 'm' && input.toLowerCase() !== 'f') defer.reject(
            '===INVALID INPUT==='
        );
        defer.resolve(input.toUpperCase());
    });
    return defer.promise;
}

function getAge() {
    let defer = q.defer();
    rl.question('Please enter your age in standard Earth years: ', (input) => {
        let numValue = parseFloat(input);
        if (isNaN(input) || numValue <= 0) defer.reject(
            '===INVALID INPUT==='
        );
        defer.resolve(input);
    });
    return defer.promise;
}

function getHeight() {
    let defer = q.defer();
    rl.question('Please enter your height in meters: ', (input) => {
        let numValue = parseFloat(input);
        if (isNaN(input) || numValue <= 0) defer.reject(
            '===INVALID INPUT==='
        );
        defer.resolve(input);
    });
    return defer.promise;
}

function getWeight() {
    let defer = q.defer();
    rl.question('Please enter your weight in kilograms: ', (input) => {
        let numValue = parseFloat(input);
        if (isNaN(input) || numValue <= 0) defer.reject(
            '===INVALID INPUT==='
        );
        defer.resolve(input);
    });
    return defer.promise;
}

function allocateStats() {
    let currentStats = {
        str: 1,
        dex: 1,
        end: 1
    };

    return getStr(currentStats).then((newStats) => {
        currentStats = newStats;
        return getDex(newStats);
    }).then((newStats) => {
        currentStats = newStats;
        return getEnd(currentStats);
    });
}

function getStr(currentStats) {
    let remaining = 15 - (currentStats.str + currentStats.dex + currentStats.end) + 1;
    let defer = q.defer();
    rl.question('Please enter your desired STRENGTH (1 - ' + remaining + '): ', (input) => {
        currentStats.str = sanitizeInputForStats(input, remaining);
        defer.resolve(currentStats);
    });
    return defer.promise;
}

function getDex(currentStats) {
    let remaining = 15 - (currentStats.str + currentStats.dex + currentStats.end) + 1;
    let defer = q.defer();
    rl.question('Please enter your desired DEXTERITY (1 - ' + remaining + '): ', (input) => {
        currentStats.dex = sanitizeInputForStats(input, remaining);
        defer.resolve(currentStats);
    });
    return defer.promise;
}

function getEnd(currentStats) {
    let remaining = 15 - (currentStats.str + currentStats.dex + currentStats.end) + 1;
    let defer = q.defer();
    rl.question('Please enter your desired ENDURANCE (1 - ' + remaining + '): ', (input) => {
        currentStats.end = sanitizeInputForStats(input, remaining);
        defer.resolve(currentStats);
    });
    return defer.promise;
}

function confirmNewPlayer(player) {
    let defer = q.defer();
    rl.question(player.getIDCard() + 'Is this information correct? (y/n)? ', (input) => {
        if (input.toLowerCase() === 'y') defer.resolve('done');
        defer.resolve();
    });
    return defer.promise;
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