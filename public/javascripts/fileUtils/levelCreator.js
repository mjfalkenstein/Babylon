'use strict';

let fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    q = require('q'),
    Robot = require(path.resolve('objects/robot.js')),
    Key = require(path.resolve('objects/key.js')),
    SDChip = require(path.resolve('objects/SDChip.js')),
    Dataslate = require(path.resolve('objects/dataslate.js')),
    StunProd = require(path.resolve('objects/stunProd.js')),
    utils = require(path.resolve('utils/utils.js')),
    Floor = require(path.resolve('levelUtils/floor.js'));

module.exports.createGame = function (dirPath) {
    dirPath = '../' + dirPath + '/';
    let files = fs.readdirSync(dirPath);
    let floors = [];
    let firstFloorID = 99999999999;
    let promise = q.when();

    _.forEach(files, (file) => {
        promise = promise.then(() => {
            return module.exports.createFloor(dirPath + file);
        }).then((newFloor) => {
            if (newFloor.id < firstFloorID) firstFloorID = newFloor.id;
            floors.push(newFloor);
        });
    });

    return promise.then(() => {
        return {
            'floors': floors,
            'firstFloorID': firstFloorID
        };
    });
};

module.exports.createFloor = function(filepath) {
    let defer = q.defer();

    fs.readFile(filepath, (err, data) => {
        if (err) defer.reject(err);
        let parsedData = JSON.parse(data);
        let walls = parsedData.walls;
        let items = parsedData.items;
        let npcs = parsedData.npcs;
        let specialCommands = parsedData.specialCommands;
        let roomDescriptions = parsedData.roomDescriptions;

        let newFloor = parseFloorData(parsedData);
        parseWallData(newFloor, walls);
        module.exports.parseItemData(newFloor, items);
        parseNPCData(newFloor, npcs);
        parseSpecialCommandsData(newFloor, specialCommands);
        parseRoomDescriptions(newFloor, roomDescriptions);

        defer.resolve(newFloor);
    });

    return defer.promise;
};

module.exports.createFloorFromJSON = function(parsedData) {
    let walls = parsedData.walls;
    let items = parsedData.items;
    let npcs = parsedData.npcs;
    let specialCommands = parsedData.specialCommands;
    let roomDescriptions = parsedData.roomDescriptions;

    let newFloor = parseFloorData(parsedData);
    parseWallData(newFloor, walls);
    module.exports.parseItemData(newFloor, items);
    parseNPCData(newFloor, npcs);
    parseSpecialCommandsData(newFloor, specialCommands);
    parseRoomDescriptions(newFloor, roomDescriptions);

    return newFloor;
};

function parseFloorData(data) {
    let floor = new Floor(data.width, data.height);
    floor.id = data.id;
    floor.entrance = data.entrance;
    floor.exit = data.exit;

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

function parseRoomDescriptions(floor, rooms) {
    _.forEach(rooms, (room) => {
        floor.rooms[room.x][room.y].description = room.description;
    });
}

module.exports.parseItemData = function(floor, items, player) {
    let newItems = [];
    _.forEach(items, (item) => {
        let newItem = module.exports.getItemFromInput(item);
        if (item.inPlayerInventory) {
            player.inventory.push(newItem);
        } else {
            if (item.visible) {
                floor.addVisibleItemToRoom(item.x, item.y, newItem);
            } else {
                floor.addHiddenItemToRoom(item.x, item.y, newItem);
            }
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
};

module.exports.getItemFromInput = function(item) {
    let newItem = null;
    switch (item.type.toLowerCase()) {
        case 'key':
            newItem = new Key();
            newItem.matchingDoor = [item.matchingDoor.floorID,
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
};

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
        newNPC.name = npc.name ? npc.name : newNPC.name;
        newNPC.type = npc.type ? npc.type : newNPC.type;
        newNPC.id = npc.id ? npc.id : newNPC.id;
        newNPC.description = npc.description ? npc.description : newNPC.description;
        newNPC.deadDescription = npc.deadDescription ? npc.deadDescription : newNPC.deadDescription;
        newNPC.hostile = npc.hostile ? npc.hostile : newNPC.hostile;
        newNPC.healthState = npc.healthState ? npc.healthState : newNPC.healthState;
        newNPC.gameState = npc.gameState ? npc.gameState : newNPC.gameState;
        newNPC.stats = npc.stats ? npc.stats : newNPC.stats;
        newNPC.pos = npc.x && npc.y ? {'x': npc.x, 'y': npc.y} : {'x': 0, 'y': 0};
        newNPC.floor = npc.floor ? npc.floor : newNPC.floor;
        newNPC.alive = npc.alive ? npc.alive : newNPC.alive;
        newNPC.weak = npc.weak ? npc.weak : newNPC.weak;
        newNPC.resist = npc.resist ? npc.resist : newNPC.resist;
        module.exports.parseItemData(null, npc.inventory, newNPC); //load npc inventory
        newNPC.placeNPCOnFloor(floor, npc.x, npc.y);
    });
}

function parseSpecialCommandsData(floor, specialCommands) {
    _.forEach(specialCommands, (specialCommand) => {
        floor.rooms[specialCommand.x][specialCommand.y].addSpecialCommand(
            specialCommand.command,
            {
                'command': specialCommand.command,
                'callback': new Function(specialCommand.args, specialCommand.callback),
                'args': specialCommand.args,
                'callbackString': specialCommand.callback
            }
        );
    });
}