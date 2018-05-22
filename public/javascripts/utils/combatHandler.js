'use strict';

let path = require('path'),
    _ = require('lodash'),
    enums = require(path.resolve('utils/enums.js')),
    utils = require(path.resolve('utils/utils.js'));

class combatHandler {
    static resolveCombatOutcome(attacker, defender, parsedInputData) {
        let retString = this.resolveAttack(attacker, defender, parsedInputData);
        if (defender.stats.hp > 0) {
            retString += '\n' + this.resolveAttack(defender, attacker, parsedInputData);
        }
        return retString;
    }

    static resolveAttack(attacker, defender, parsedInputData) {
        let weapon = this.getWeapon(attacker, parsedInputData);
        let retString = '';

        let chanceToHit = 50 + ((attacker.stats.dex - defender.stats.dex) * 10);
        if (utils.getRandomInt(100) < chanceToHit) {
            let damage = weapon.damage + attacker.stats.str;
            if (defender.resist.includes(weapon.type)) damage = Math.floor(damage / 2);
            if (defender.weak.includes(weapon.type)) damage = Math.floor(damage * 2);
            defender.stats.hp -= damage;
            if (attacker.constructor.name.toLowerCase() === 'player') {
                retString = 'You hit ' + defender.name + ' with your ' + weapon.name + ' for ' + damage + ' damage!';
            } else {
                retString = attacker.name + ' hit you with its ' + weapon.name + ' for ' + damage + ' damage!';
            }
        } else {
            if (attacker.constructor.name.toLowerCase() === 'player') {
                return 'You missed!';
            } else {
                return attacker.name + ' missed you!';
            }
        }

        return retString + this.resolveDeath(attacker, defender);
    }

    static resolveDeath(attacker, defender) {
        if (defender.stats.hp > 0) return '';
        defender.healthState = enums.HEALTH_STATES.DEAD;

        if (attacker.constructor.name.toLowerCase() === 'player') {
            defender.floor.rooms[defender.pos.x][defender.pos.y].removeNPCFromRoom(defender);
            defender.floor.rooms[defender.pos.x][defender.pos.y].addDeadNPCToRoom(defender);
            return '\nYou\'ve killed ' + defender.name + '!';
        }

        return '\nYou\'ve been killed by ' + attacker.name + '!\n' +
            'Use \'!create\' to create a new character.';
    }

    static getWeapon(attacker, parsedInputData) {
        let fists = {name: 'Fists', damage: 0, type: enums.DAMAGE_TYPES.BLUNT};
        if (!parsedInputData.indirect) return fists;
        let bestSimilarity = 0.0;
        let bestWeapon = fists;

        _.forEach(attacker.inventory, function(item) {
            let similarity = utils.similarity(parsedInputData.indirect, item.name);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestWeapon = item;
            }
        });
        if (bestSimilarity > 0.25) {
            return bestWeapon;
        } else {
            return fists;
        }
    }
}

module.exports = combatHandler;