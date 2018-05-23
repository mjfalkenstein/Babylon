'use strict';

let path = require('path'),
    _ = require('lodash'),
    enums = require(path.resolve('utils/enums.js'));

module.exports.getDirectionFromString = function(input) {
    if (input.toLowerCase() === 'north' || input.toLowerCase() === 'up') return enums.DIRECTIONS.NORTH;
    if (input.toLowerCase() === 'east' || input.toLowerCase() === 'right') return enums.DIRECTIONS.EAST;
    if (input.toLowerCase() === 'south' || input.toLowerCase() === 'down') return enums.DIRECTIONS.SOUTH;
    if (input.toLowerCase() === 'west' || input.toLowerCase() === 'left') return enums.DIRECTIONS.WEST;
    return null;
};

module.exports.getStringFromDirection = function(dir) {
    if (dir === enums.DIRECTIONS.NORTH) return 'north';
    if (dir === enums.DIRECTIONS.EAST) return 'east';
    if (dir === enums.DIRECTIONS.SOUTH) return 'south';
    if (dir === enums.DIRECTIONS.WEST) return 'west';
};

module.exports.getWallStateFromString = function(input) {
    if (input.toLowerCase() === 'open' || input.toLowerCase() === 'o') return enums.WALL_STATES.OPEN;
    if (input.toLowerCase() === 'wall' || input.toLowerCase() === 'w') return enums.WALL_STATES.WALL;
    if (input.toLowerCase() === 'locked' || input.toLowerCase() === 'l') return enums.WALL_STATES.LOCKED;
    if (input.toLowerCase() === 'unlocked' || input.toLowerCase() === 'u') return enums.WALL_STATES.UNLOCKED;
};

module.exports.getStringFromWallState = function(state) {
    if (state === enums.WALL_STATES.OPEN) return 'open';
    if (state === enums.WALL_STATES.WALL) return 'wall';
    if (state === enums.WALL_STATES.LOCKED) return 'locked';
    if (state === enums.WALL_STATES.UNLOCKED) return 'unlocked';
};

module.exports.formatStringToGivenLength = function(input, desiredLength) {
    input = input.toString();
    let difference = input.length - desiredLength;
    if (difference === 0) return input;
    if (difference < 0) {
        return input + (' '.repeat(Math.abs(difference)));
    } else {
        return input.substring(0, desiredLength - 1) + '…';
    }
};

module.exports.formatStringInTextBox = function(input, desiredWidth) {
    desiredWidth -= 4;
    input = input.toString();
    let retString = '```┏' + _.repeat('━', desiredWidth + 2) + '┓\n';
    let lines = splitStringIntoLines(input, desiredWidth - 4);

    _.forEach(lines, (line) => {
        if (!line) {
            retString += '┃' + _.repeat(' ', desiredWidth + 2) + '┃\n';
        } else {
            retString += '┃ ' + line + ' '.repeat(desiredWidth - line.length) + ' ┃\n';
        }
    });

    retString += '┗' + _.repeat('━', desiredWidth + 2) + '┛```\n';
    return retString;
};

function splitStringIntoLines(input, desiredWidth) {
    let retLines = [''];
    let currentLine = 0;
    let words = input.split(' ');
    let first = true;
    let currentWidth = 0;

    _.forEach(words, (word) => {
        currentWidth += word.length;
        if (word.includes('\n')) {
            let count = word.match(/\n/g).length;
            word = word.replaceAll('\n', '');
            currentLine += count + 1;
            currentWidth = word.length;
            retLines[currentLine] = word;
        } else {
            if (currentWidth > desiredWidth) {
                currentLine++;
                currentWidth = word.length;
                retLines[currentLine] = word;
            } else {
                if (!first) {
                    retLines[currentLine] += ' ';
                    currentWidth++;
                }
                retLines[currentLine] += word;
            }
        }
        first = false;
    });

    return retLines;
}

String.prototype.replaceAll = function(search, replacement) {
    let target = this;
    return target.split(search).join(replacement);
};

module.exports.getRandomInt = function(max) {
    return Math.floor(Math.random() * Math.floor(max));
};

module.exports.similarity = function(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
};

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    let costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}