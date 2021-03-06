/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');

var Bot = require('../models/machinemodels/bot');
var Machine = require('../models/machinemodels/machine');
var File = require('../models/filemodels/file');
var BankAccount = require('../models/bankmodels/bankaccount');

var auth = require('../middlewares/authMiddleware');

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;
var errorHelpers = require('../helpers/errorHelpers');


router.get('/', auth.isLoggedIn, function (req, res) {
    if (req.user._id) {
        Bot.findByUserPopulated(req.user, function (err, bots) {
            if (err)
                return errorHelpers.returnError("Failed to initialize bots.  Please try again later.", res, err);

            for (var i = 0; i < bots.length; i++) {
                bots[i] = bots[i].toObject();
                bots[i].profitPerTick = sharedHelpers.botHelpers.calculateProfitPerTick(bots[i]);
                bots[i].power = sharedHelpers.botHelpers.calculatePower(bots[i]);
                bots[i] = filterBotHardware(bots[i]);
            }

            res.json(bots ? bots : []);
        })
    }
    else {
        res.json({});
    }
});

router.get('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params && req.params._id) {
        Bot.findByIdPopulated(req.user, req.params._id, function (err, bot) {
            if (err)
                console.log(err);

            bot.machine.validateAuth(req.user, req.query.password, function (isAuthenticated) {
                if (isAuthenticated) {
                    bot = bot.toObject();
                    bot.profitPerTick = sharedHelpers.botHelpers.calculateProfitPerTick(bot);
                    bot.power = sharedHelpers.botHelpers.calculatePower(bot);
                    res.json(filterBotHardware(bot));
                }
                else {
                    bot.remove(function (err) {
                        if (err)
                            console.log(err);
                        res.json({});
                    })
                }
            });
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

    Bot.findByIdPopulated(req.user, req.params._id, function (err, bot) {
        if (err)
            console.log(err);

        var response = {};
        bot.machine.validateAuth(req.user, req.query.password, function (isAuthenticated) {
            if (isAuthenticated) {
                if (req.body.job != null && req.body.job === bot.job)
                    errorHelpers.returnError("The selected bot is already assigned this job.", res);

                bot.setProfit();
                if (req.body.job != null) {
                    if (req.body.job > -1) {
                        var fileStats = bot.machine.getFileStats(),
                            isStart = false;
                        switch (req.body.job) {
                            case sharedHelpers.botHelpers.jobTypes.SPAM:
                                if (fileStats[sharedHelpers.fileHelpers.types.SPAM] > 0) {
                                    isStart = true;
                                }
                                break;
                            case sharedHelpers.botHelpers.jobTypes.WAREZ:
                                if (fileStats[sharedHelpers.fileHelpers.types.WAREZ] > 0) {
                                    isStart = true;
                                }
                                break;
                            case sharedHelpers.botHelpers.jobTypes.MINER:
                                if (fileStats[sharedHelpers.fileHelpers.types.MINER] > 0) {
                                    isStart = true;
                                }
                                break;
                            case sharedHelpers.botHelpers.jobTypes.DDOS:
                                if (fileStats[sharedHelpers.fileHelpers.types.DDOS] > 0) {
                                    isStart = true;
                                }
                                break;
                            default:
                                break;
                        }
                        if (isStart) {
                            bot.job = req.body.job;
                            bot.jobStartedOn = new Date();
                            bot.lastCalculatedOn = new Date();
                        }
                        else {
                            return errorHelpers.returnError("The selected bot does not have the necessary software to start this job.", res);
                        }
                    }
                    else {
                        bot.job = null;
                        bot.jobStartedOn = null;
                        bot.lastCalculatedOn = null;
                    }

                    botResponse(bot, res);
                }
                else if (req.body.bankAccount != null) {
                    BankAccount.findById(req.body.bankAccount, function (err, bankAccount) {
                        if (err || !bankAccount)
                            return errorHelpers.returnError("Failed to collect profit.", res, err);

                        bankAccount.collectBotProfit(req.user, bot, function (UIError, err) {
                            if (err || UIError)
                                return errorHelpers.returnError(UIError, res, err);

                            botResponse(bot, res);
                        })
                    });
                }
                else {
                    return errorHelpers.returnError("No action provided to perform on the selected bot.", res, err);
                }
            }
            else {
                bot.remove(function (err) {
                    if (err)
                        console.log(err);

                    return errorHelpers.returnError("You no longer have admin permissions on this machine.  It has been removed from your bots.", res);
                })
            }
        });
    });
});

function botResponse(bot, res) {
    bot.save(function (err) {
        if (err)
            console.log(err);

        bot = bot.toObject();
        bot.profitPerTick = sharedHelpers.botHelpers.calculateProfitPerTick(bot);
        res.json(filterBotHardware(bot));
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

router.delete('/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params._id)
        return errorHelpers.returnError_noId(res);

    Bot.findByIdPopulated(req.user, req.params._id, function (err, bot) {
        if (err)
            return errorHelpers.returnError("Failed to find a bot with the provided id.", res, err);
        else if (!bot)
            return errorHelpers.returnError("No bot could be found with provided id.", res);
        else if (bot.user.toString() != req.user._id.toString())
            return errorHelpers.returnError("You don't have permission to delete this bot.", res);

        bot.remove(function (err) {
            if (err)
                return errorHelpers.returnError("Failed to delete the selected bot", res, err);

            res.json(filterBotHardware(bot));
        });
    });
});

module.exports = router;