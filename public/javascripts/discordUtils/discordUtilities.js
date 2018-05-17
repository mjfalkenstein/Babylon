'use strict';

let Discord = require('discord.js'),
    path = require('path'),
    q = require('q'),
    mongoose = require('mongoose'),
    auth = require(path.resolve('auth.json')),
    inputHandler = require(path.resolve('utils/inputHandler.js')),
    MESSAGE_PREFIX = '!',
    mongoTarget = 'mongodb://localhost:27017/db',
    bot = new Discord.Client();

module.exports.init = function (firstFloor) {
    bot.on('ready', () => {
        console.log('Connected to Discord');
        console.log('Logged in as: ' + bot.user.tag + ' - (' + bot.user.id + ')');
        return connect(mongoTarget).then(() => {
            console.log('Connected to Mongo');
            console.log('Mongo target: ' + mongoTarget);
        });
    });

    bot.on('message', (msg) => {
        if (msg.mentions.users.keyArray().includes(auth.clientID) || msg.content.substring(0, 1) === MESSAGE_PREFIX) {
            msg.trimmedMessage = msg.content.replace('<@' + auth.clientID + '>', '').trim();
            if (msg.trimmedMessage.substring(0, 1) === MESSAGE_PREFIX)
                msg.trimmedMessage = msg.trimmedMessage.substring(1);
            if (msg.trimmedMessage === 'ping') {
                return msg.channel.send('pong');
            } else {
                let player = null;
                return loadPlayer(msg).then((loadResults) => {
                    return inputHandler.parsePlayerInput(loadResults.player, msg, firstFloor);
                }).then((result) => {
                    player = result.player;
                    return msg.reply(result.message);
                }).then(() => {
                    return savePlayer(player);
                }).then(() => {
                    console.log('Sent reply to: ' + msg.author.username + ' (' + msg.author.id + ')');
                }).catch((err) => {
                    console.error(err);
                });
            }
        }
    });

    bot.on('disconnect', () => {
        bot.login(auth.token);
    });

    return bot.login(auth.token);
};

function savePlayer(player) {
    return inputHandler.save(player);
}

function loadPlayer(msg) {
    return inputHandler.load({'id': msg.author.id});
}

function connect(dbName) {
    return mongoose.connect(dbName);
}