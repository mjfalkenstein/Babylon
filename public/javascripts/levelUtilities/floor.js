'use strict';

let path = require('path'),
    Room = require(path.resolve('levelUtilities/room.js')),
    Wall = require(path.resolve('levelUtilities/wall.js')),
    _ = require('lodash'),
    combatHandler = require(path.resolve('generalUtilities/combatHandler.js')),
    enums = require(path.resolve('generalUtilities/enums.js'));

let FOG_OF_WAR = '░';
let WALL = '█';
let PLAYER = '@';
let FLOOR = ' ';
let DOOR = 'D';

class Floor {
    constructor(width = 3, height = 3) {
        this.width = width;
        this.height = height;
        this.id = -1;
        this.rooms = new Array(width);
        this.walls = new Array(width);
        this.entrance = {
            x: 0,
            y: 0
        };
        this.exit = {
            x: this.width,
            y: this.height,
            nextFloor: null
        };
        for (let i = 0; i < width; i++) {
            this.rooms[i] = new Array(height);
            this.walls[i] = new Array(height);
            for (let j = 0; j < height; j++) {
                this.rooms[i][j] = new Room();
                this.walls[i][j] = new Array(4);
                for (let k = 0; k < 4; k++) {
                    this.walls[i][j][k] = new Wall();
                }
            }
        }
    }

    setWallState(x, y, direction, state) {
        this.walls[x][y][direction].state = state;
        let targetX = x;
        let targetY = y;
        switch (direction) {
            case enums.DIRECTIONS.NORTH:
                if (y === 0) throw 'direction not allowed: ' + direction;
                targetY--;
                break;
            case enums.DIRECTIONS.EAST:
                if (x === this.width) throw 'direction not allowed: ' + direction;
                targetX++;
                break;
            case enums.DIRECTIONS.SOUTH:
                if (y === this.height) throw 'direction not allowed: ' + direction;
                targetY++;
                break;
            case enums.DIRECTIONS.WEST:
                if (x === 0) throw 'direction not allowed: ' + direction;
                targetX--;
                break;
            default:
                //if an invalid direction is entered, do nothing
                return;
        }
        let targetDirection = ((direction + 2) % 4);
        this.walls[targetX][targetY][targetDirection].state = state;
    }

    toJSON() {
        return {
            width: this.width,
            height: this.height,
            rooms: this.rooms,
            walls: this.walls,
            id: this.id
        };
    }

    getTraversable(x, y, direction) {
        let wall = this.walls[x][y][direction];
        return wall.state === 'O' || wall.state === 'U';
    }

    getFloorStringForWall(x, y, direction) {
        let retString = '';
        let wallString = this.rooms[x][y].visible ? WALL : FOG_OF_WAR;
        if (!this.rooms[x][y].visible) return wallString;
        if (this.getTraversable(x, y, direction)) {
            retString = FLOOR;
        } else {
            if (this.walls[x][y][direction].state === 'L') {
                retString = DOOR;
            } else {
                retString = wallString;
            }
        }
        return retString;
    }

    getRoomString(x, y, player) {
        if (x === player.pos.x && y === player.pos.y) return PLAYER;
        for (let i = 0; i < 4; i++) {
            if (this.getTraversable(x, y, i) && this.rooms[x][y].visible) return FLOOR;
        }
        return FOG_OF_WAR;
    }

    setRoomVisible(x, y, visible) {
        this.rooms[x][y].visible = visible;
    }

    getFloorMap(player) {
        let outString = '';

        for (let i = 0; i < this.height; i++) {
            for (let k = 0; k < 3; k++) {
                for (let j = 0; j < this.width; j++) {
                    let wallString = this.rooms[j][i].visible ? WALL : FOG_OF_WAR;
                    if (k % 3 === 0) {
                        outString += wallString + this.getFloorStringForWall(j, i, 0) + wallString;
                    }
                    if (k % 3 === 1) {
                        outString += this.getFloorStringForWall(j, i, 3) +
                            this.getRoomString(j, i, player) +
                            this.getFloorStringForWall(j, i, 1);
                    }
                    if (k % 3 === 2) {
                        outString += wallString + this.getFloorStringForWall(j, i, 2) + wallString;
                    }
                }
                outString += '\n';
            }
        }

        return outString;
    }

    handleExit(input, player) {
        input = input.replace('go', '').replace('move', '').replace('walk', '').trim();
        if (!this.exit.nextFloor) {
            return 'You have reached the exit of the final floor!';
        } else {
            if (input.includes('stairs') || input.includes('steps')) {
                player.placePlayerOnFloor(this.exit.nextFloor);
                let entranceRoom = this.exit.nextFloor.rooms[this.exit.nextFloor.entrance.x]
                                                            [this.exit.nextFloor.entrance.y].description;
                return 'You take the stairs.\n' + entranceRoom;
            } else {
                return this.handleDirectionalInput(input, player);
            }
        }
    }

    handleDirectionalInput(input, player) {
        input = input.replace('go', '').replace('move', '').replace('walk', '').trim();
        let currentRoom = player.floor.rooms[player.pos.x][player.pos.y];

        let retString = '';
        if (input === 'north' || input === 'up' || input === 'n') {
            if (this.getTraversable(player.pos.x, player.pos.y, enums.DIRECTIONS.NORTH)) {
                player.pos.y--;
                retString += 'You go ' + input + '.\n';
                let targetRoom = this.rooms[player.pos.x][player.pos.y];
                if (!targetRoom.visible) {
                    this.setRoomVisible(player.pos.x, player.pos.y, true);
                    retString += targetRoom.description;
                }
            } else {
                retString += 'Cannot go ' + input + ', there\'s something in the way.';
            }
        } else if (input === 'east' || input === 'right' || input === 'e') {
            if (this.getTraversable(player.pos.x, player.pos.y, enums.DIRECTIONS.EAST)) {
                player.pos.x++;
                retString += 'You go ' + input + '.\n';
                let targetRoom = this.rooms[player.pos.x][player.pos.y];
                if (!targetRoom.visible) {
                    this.setRoomVisible(player.pos.x, player.pos.y, true);
                    retString += targetRoom.description;
                }
            } else {
                retString += 'Cannot go ' + input + ', there\'s something in the way.';
            }
        } else if (input === 'south' || input === 'down' || input === 's') {
            if (this.getTraversable(player.pos.x, player.pos.y, enums.DIRECTIONS.SOUTH)) {
                player.pos.y++;
                retString += 'You go ' + input + '.\n';
                let targetRoom = this.rooms[player.pos.x][player.pos.y];
                if (!targetRoom.visible) {
                    this.setRoomVisible(player.pos.x, player.pos.y, true);
                    retString += targetRoom.description;
                }
            } else {
                retString += 'Cannot go ' + input + ', there\'s something in the way.';
            }
        } else if (input === 'west' || input === 'left' || input === 'w') {
            if (this.getTraversable(player.pos.x, player.pos.y, enums.DIRECTIONS.WEST)) {
                player.pos.x--;
                retString += 'You go ' + input + '.\n';
                let targetRoom = this.rooms[player.pos.x][player.pos.y];
                if (!targetRoom.visible) {
                    this.setRoomVisible(player.pos.x, player.pos.y, true);
                    retString += targetRoom.description;
                }
            } else {
                retString += 'Cannot go ' + input + ', there\'s something in the way.';
            }
        }

        _.forEach(currentRoom.liveNPCs, (npc) => {
            if (npc.hostile) {
                retString += combatHandler.resolveAttack(npc, player, {});
                return retString;
            }
        });

        return retString;
    }

    teleportPlayerToRoom(player, targetX, targetY) {
        _.forEach(this.rooms, function(row) {
            _.forEach(row, (room) => {
                room.visible = false;
            });
        });
        player.pos.x = targetX;
        player.pos.y = targetY;
        if (!this.rooms[targetX][targetY].visible) {
            this.rooms[targetX][targetY].visible = true;
            return this.rooms[targetX][targetY].description;
        }
    }

    initMapForPlayer(player) {
        this.setRoomVisible(player.pos.x, player.pos.y, true);
    }

    addHiddenItemToRoom(x, y, item) {
        this.rooms[x][y].hiddenItems.push(item);
    }

    addVisibleItemToRoom(x, y, item) {
        this.rooms[x][y].visibleItems.push(item);
    }
}

String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
};

module.exports = Floor;