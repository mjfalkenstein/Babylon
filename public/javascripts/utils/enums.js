'use strict';

module.exports = {
    DIRECTIONS: {
        NORTH: 0,
        EAST: 1,
        SOUTH: 2,
        WEST: 3
    },
    HEALTH_STATES: {
        HEALTHY: 'healthy',
        INJURED: 'injured',
        DEAD: 'dead'
    },
    GAME_STATES: {
        IDLE: 'idle',
        COMBAT: 'combat',
        GAME_DONE: 'game_done'
    },
    WALL_STATES: {
        UNLOCKED: 'U',
        LOCKED: 'L',
        WALL: 'W',
        OPEN: 'O'
    },
    DAMAGE_TYPES: {
        FIRE: 'fire',
        ICE: 'ice',
        SHOCK: 'shock',
        BLUNT: 'blunt',
        PIERCE: 'pierce',
        SLASH: 'slash'
    }
};