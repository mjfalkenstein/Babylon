'use strict';

const path = require('path'),
    Player = require(path.resolve('objectUtilities/player.js')),
    Floor = require(path.resolve('levelUtilities/floor.js')),
    enums = require(path.resolve('generalUtilities/enums.js')),
    Key = require(path.resolve('objectUtilities/key.js')),
    SDChip = require(path.resolve('objectUtilities/SDChip.js')),
    dataSlate = require(path.resolve('objectUtilities/dataslate.js')),
    characterCreator = require(path.resolve('generalUtilities/characterCreator.js'));

function main() {

    let floor1 = new Floor(5, 3);
    floor1.id = 1;
    floor1.entrance = {x: 0, y: 1};
    floor1.setWallState(0, 0, enums.DIRECTIONS.SOUTH, enums.WALL_STATES.OPEN);
    floor1.setWallState(0, 0, enums.DIRECTIONS.EAST, enums.WALL_STATES.OPEN);
    floor1.setWallState(0, 1, enums.DIRECTIONS.EAST, enums.WALL_STATES.OPEN);
    floor1.setWallState(2, 2, enums.DIRECTIONS.NORTH, enums.WALL_STATES.OPEN);
    floor1.setWallState(1, 1, enums.DIRECTIONS.SOUTH, enums.WALL_STATES.OPEN);
    floor1.setWallState(2, 1, enums.DIRECTIONS.EAST, enums.WALL_STATES.OPEN);
    floor1.setWallState(4, 1, enums.DIRECTIONS.NORTH, enums.WALL_STATES.OPEN);
    floor1.setWallState(4, 0, enums.DIRECTIONS.WEST, enums.WALL_STATES.OPEN);
    floor1.setWallState(2, 1, enums.DIRECTIONS.NORTH, enums.WALL_STATES.OPEN);
    floor1.setWallState(2, 1, enums.DIRECTIONS.WEST, enums.WALL_STATES.OPEN);
    floor1.setWallState(2, 0, enums.DIRECTIONS.EAST, enums.WALL_STATES.OPEN);
    floor1.setWallState(2, 1, enums.DIRECTIONS.NORTH, enums.WALL_STATES.LOCKED);

    let floor2 = new Floor(3, 3);
    floor2.id = 2;
    floor2.entrance = {x: 0, y: 0};
    floor2.setWallState(0, 0, enums.DIRECTIONS.EAST, enums.WALL_STATES.OPEN);
    floor2.setWallState(1, 1, enums.DIRECTIONS.NORTH, enums.WALL_STATES.OPEN);
    floor2.setWallState(1, 1, enums.DIRECTIONS.EAST, enums.WALL_STATES.OPEN);
    floor2.setWallState(1, 1, enums.DIRECTIONS.SOUTH, enums.WALL_STATES.OPEN);
    floor2.setWallState(1, 1, enums.DIRECTIONS.WEST, enums.WALL_STATES.OPEN);

    floor1.exit = {x: 1, y: 0, nextFloor: floor2};
    floor2.exit = {x: 1, y: 2, nextFloor: null};

    let testPlayer = new Player();

    floor1.rooms[floor1.entrance.x][floor1.entrance.y].addSpecialCommand('test',
        function (player) {
            let retString = floor1.teleportPlayerToRoom(player, 0, floor1.height - 1);
            return 'You\'ve been teleported to the corner!\n' + retString;
        }
    );

    return characterCreator.createCharacter(floor1, testPlayer).then(() => {
        let key1 = new Key();
        let key2 = new Key();
        let sdchip1 = new SDChip();
        let dataslate1 = new dataSlate();
        sdchip1.otherObject = dataslate1;
        floor1.addVisibleItemToRoom(1, 2, key1);
        floor1.addVisibleItemToRoom(1, 1, key2);
        floor1.addVisibleItemToRoom(0, 0, sdchip1);
        floor1.addVisibleItemToRoom(0, 0, dataslate1);
        key1.matchingDoorCoords = [floor1.id, 2, 1, 0];
    });
}

main();