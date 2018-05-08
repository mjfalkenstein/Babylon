'use strict';

module.exports = {
    DIRECTIONS: {
        NORTH: 0,
        EAST: 1,
        SOUTH: 2,
        WEST: 3
    },
    PLAYER_STATES: {
        HEALTHY: 'healthy',
        INJURED: 'injured',
        DEAD: 'dead'
    },
    GAME_STATES: {
        IDLE: 'idle',
        COMBAT: 'combat'
    },
    WALL_STATES: {
        UNLOCKED: 'U',
        LOCKED: 'L',
        WALL: 'W',
        OPEN: 'O'
    },
    DAMAGE_TYPES: {
        FIRE: 0,
        ICE: 1,
        SHOCK: 2,
        BLUNT: 3,

    }
};