'use strict';

let path = require('path'),
    enums = require(path.resolve('generalUtilities/enums.js'));

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