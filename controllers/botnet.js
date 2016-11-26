/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');

var _ = require('underscore');

var Botnet = require('../models/machinemodels/botnet');
var Bot = require('../models/machinemodels/bot');
var Machine = require('../models/machinemodels/machine');
var File = require('../models/filemodels/file');
var BankAccount = require('../models/bankmodels/bankaccount');

var auth = require('../middlewares/authMiddleware');

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;
var errorHelpers = require('../helpers/errorHelpers');

router.post('/', auth.isLoggedIn, function (req, res) {
    Botnet.findByUserNotPopulated(req.user, function (err, botnets) {
        if (err)
            console.log(err);

        var botnet = new Botnet({
            name: "New Botnet " + ((botnets ? botnets.length : 0) + 1).toString(),
            user: req.user._id
        });
        botnet.save(function (err) {
            if (err)
                return errorHelpers.returnError("Failed to create botnet.  Please try again later.", res, err);

            return res.json(botnet);
        })
    });
});

router.get('/', auth.isLoggedIn, function (req, res) {
    Botnet.findByUserPopulated(req.user, function (err, botnets) {
        if (err)
            return errorHelpers.returnError("Failed to initialize botnets.  Please try again later.", res, err);

        for (var i = 0; i < botnets.length; i++) {
            botnets[i] = addBotnetStats(botnets[i]);
        }
        res.json(botnets ? botnets : []);
    })
});

router.get('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params && req.params._id) {
        Botnet.findByIdPopulated(req.user, req.params._id, function (err, botnet) {
            if (err)
                console.log(err);

            botnet = addBotnetStats(botnet);
            res.json(botnet);
        });
    }
    else {
        errorHelpers.returnError_get_noId(res);
    }
});

router.patch('/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params._id) {
        return errorHelpers.returnError_noId(res);
    }

    Botnet.findByIdPopulated(req.user, req.params._id, function (err, botnet) {
        if (err || !botnet)
            return errorHelpers.returnError("Failed to find botnet with supplied id.", res);

        if (req.body.name) {
            botnet.name = req.body.name;
            return botnetResponse(botnet, res);
        }
        else if (req.body.newBots) {
            if (req.body.newBots.length > 0) {
                var ids = {
                    _id: {$in: req.body.newBots}
                };
                Bot.findPopulated(req.user, ids, function (err, bots) {
                    if (err || !bots || bots.length === 0) {
                        return errorHelpers.returnError("Failed to add selected bot(s) to botnet.  Please try again.", res, err);
                    }
                    else {
                        for (var i = 0; i < bots.length; i++) {
                            botnet.bots.push(bots[i]);
                        }
                        botnet.save(function (err) {
                            if (err)
                                return errorHelpers.returnError("Failed to add selected bot(s) to botnet.  Please try again.", res, err);

                            console.log(ids);
                            Bot.update(ids, {botnet: botnet._id}, {multi: true}, function (err) {
                                if (err)
                                    return errorHelpers.returnError("Failed to add selected bot(s) to botnet.  Please try again.", res, err);

                                return botnetResponse(botnet, res);
                            });
                        });
                    }
                });
            }
            else
                return botnetResponse(botnet, res);
        }
        else if (req.body.removeBot) {
            var removeBot = req.body.removeBot;
            if (removeBot) {
                botnet.bots.pull(removeBot);
                botnet.save(function (err) {
                    if (err)
                        return errorHelpers.returnError("Failed to remove selected bot from botnet.  Please try again.", res, err);

                    Bot.update({_id: removeBot}, {botnet: null}, {multi: true}, function (err) {
                        if (err)
                            return errorHelpers.returnError("Failed to add selected bot(s) to botnet.  Please try again.", res, err);

                        return botnetResponse(botnet, res);
                    });
                });
            }
            else
                return botnetResponse(botnet, res);
        }
        else {
            return botnetResponse(botnet, res);
        }
    });
});

function botnetResponse(botnet, res) {
    botnet.save(function (err) {
        if (err)
            console.log(err);

        botnet = addBotnetStats(botnet);

        res.json(botnet);
    });
}

function filterBotHardware(bot) {
    if (!bot.isAnalyzed) {
        bot.machine.cpu = null;
        bot.machine.gpu = null;
        bot.machine.externalHDD = null;
        bot.machine.internet = null;
    }
    return bot;
}

function addBotnetStats(botnet) {
    botnet = botnet.toObject();
    var totalProfitPerTick = 0,
        totalPower = 0;
    for (var j = 0; j < botnet.bots.length; j++) {
        var thisProfitPerTick = sharedHelpers.botHelpers.calculateProfitPerTick(botnet.bots[j]),
            thisPower = sharedHelpers.botHelpers.calculatePower(botnet.bots[j]);
        botnet.bots[j].profitPerTick = thisProfitPerTick;
        totalProfitPerTick += thisProfitPerTick;
        botnet.bots[j].power = thisPower;
        totalPower += thisPower;
        botnet.bots[j] = filterBotHardware(botnet.bots[j]);
    }
    botnet.profitPerTick = totalProfitPerTick;
    botnet.power = totalPower;

    return botnet;
}

router.delete('/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params._id)
        return errorHelpers.returnError_noId(res);

    Botnet.findByIdPopulated(req.user, req.params._id, function (err, botnet) {
        if (err)
            return errorHelpers.returnError("Failed to find a botnet with the provided id.", res, err);
        else if (!botnet)
            return errorHelpers.returnError("No botnet could be found with provided id.", res);
        else if (botnet.user.toString() != req.user._id.toString())
            return errorHelpers.returnError("You don't have permission to delete this botnet.", res);

        botnet.remove(function (err) {
            if (err)
                return errorHelpers.returnError("Failed to delete the selected botnet", res, err);

            res.json(botnet);
        });
    });
});

module.exports = router;