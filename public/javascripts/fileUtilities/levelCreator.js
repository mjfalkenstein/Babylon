'use strict';

let fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    q = require('q'),
    Robot = require(path.resolve('objectUtilities/robot.js')),
    Key = require(path.resolve('objectUtilities/key.js')),
    SDChip = require(path.resolve('objectUtilities/SDChip.js')),
    Dataslate = require(path.resolve('objectUtilities/dataslate.js')),
    StunProd = require(path.resolve('objectUtilities/stunProd.js')),
    utils = require(path.resolve('generalUtilities/utils.js')),
    Floor = require(path.resolve('levelUtilities/floor.js'));

module.exports.createGame = function (dirPath) {
    dirPath = '../' + dirPath + '/';
    let files = fs.readdirSync(dirPath);
    let floors = [];
    let firstFloorID = 99999999999;
    let promise = q.when();

    _.forEach(files, (file) => {
        promise = promise.then(() => {
            return createFloor(dirPath + file);
        }).then((newFloor) => {
            if (newFloor.id < firstFloorID) firstFloorID = newFloor.id;
            floors.push(newFloor);
        });
    });

    return promise.then(() => {
        for (let i = 0; i < floors.length; i++) {
            if (floors[i].nextFloorID) {
                for (let j = 0; j < floors.length; j++) {
                    if (floors[j].id === floors[i].nextFloorID) {
                        floors[i].exit.nextFloor = floors[j];
                    }
                }
            }
        }
        return {
            'floors': floors,
            'firstFloorID': firstFloorID
        };
    });
};

function createFloor(filepath) {
    let defer = q.defer();

    fs.readFile(filepath, (err, data) => {
        if (err) throw err;
        let parsedData = JSON.parse(data);
        let walls = parsedData.walls;
        let items = parsedData.items;
        let npcs = parsedData.npcs;
        let specialCommands = parsedData.specialCommands;

        let newFloor = parseFloorData(parsedData);
        parseWallData(newFloor, walls);
        parseItemData(newFloor, items);
        parseNPCData(newFloor, npcs);
        parseSpecialCommandsData(newFloor, specialCommands);

        defer.resolve(newFloor);
    });

    return defer.promise;
}

function parseFloorData(data) {
    let floor = new Floor(data.width, data.height);
    floor.id = data.id;
    floor.entrance = data.entrance;
    floor.exit = data.exit;
    floor.nextFloorID = data.exit.nextFloorID;

    return floor;
}

function parseWallData(floor, walls) {
    _.forEach(walls, (wall) => {
        floor.setWallState(wall.x,
            wall.y,
            utils.getDirectionFromString(wall.dir),
            utils.getWallStateFromString(wall.state));
    });
}

function parseItemData(floor, items) {
    let newItems = [];
    _.forEach(items, (item) => {
        let newItem = getItemFromInput(floor, item);
        if (item.visible) {
            floor.addVisibleItemToRoom(item.x, item.y, newItem);
        } else {
            floor.addHiddenItemToRoom(item.x, item.y, newItem);
        }
        newItems.push(newItem);
    });

    for (let i = 0; i < newItems.length; i++) {
        if (newItems[i].matchingObject) {
            for (let j = 0; j < newItems.length; j++) {
                if (newItems[j].id === newItems[i].matchingObject) {
                    newItems[i].otherObject = newItems[j];
                    break;
                }
            }
        }
    }
}

function getItemFromInput(floor, item) {
    let newItem = null;
    switch (item.type.toLowerCase()) {
        case 'key':
            newItem = new Key();
            newItem.matchingDoorCoords = [floor.id,
                item.matchingDoor.x,
                item.matchingDoor.y,
                utils.getDirectionFromString(item.matchingDoor.dir)];
            break;
        case 'sdchip':
            newItem = new SDChip();
            newItem.matchingObject = item.matchingObject;
            break;
        case 'dataslate':
            newItem = new Dataslate();
            newItem.description = item.data || newItem.description;
            break;
        case 'stunprod':
            newItem = new StunProd();
            break;
        default:
            throw new Error('Unknown item type: ' + item.type);
    }

    newItem.x = item.x;
    newItem.y = item.y;
    newItem.id = item.id;
    return newItem;
}

function parseNPCData(floor, npcs) {
    _.forEach(npcs, (npc) => {
        let newNPC = null;
        switch (npc.type.toLowerCase()) {
            case 'robot':
                newNPC = new Robot();
                break;
            default:
                throw new Error('Unknown NPC type: ' + npc.type);
        }
        newNPC.placeNPCOnFloor(floor, npc.x, npc.y);
    });
}

function parseSpecialCommandsData(floor, specialCommands) {
    _.forEach(specialCommands, (specialCommand) => {
        floor.rooms[specialCommand.x][specialCommand.y].addSpecialCommand(
            specialCommand.command,
            new Function(specialCommand.args, specialCommand.callback)
        );
    });
}