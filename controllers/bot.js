/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');

var Bot = require('../models/machinemodels/bot');
var Machine = require('../models/machinemodels/machine');
var File = require('../models/filemodels/file');

var auth = require('../middlewares/authMiddleware');

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;
var errorHelpers = require('../helpers/errorHelpers');


router.get('/', auth.isLoggedIn, function (req, res) {
    var response = {machine: {}};
    if (req.user._id) {
        Bot.findByUserPopulated(req.user, function (err, bots) {
            if (err)
                return errorHelpers.returnError("Failed to initialize botnet.  Please try again later.", res, err);

            res.json(bots ? bots : []);
        })
    }
    else {
        res.json(response)
    }
});

router.get('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params && req.params._id) {
        Bot.findByIdPopulated(req.params._id, function (err, bot) {
            if (err)
                console.log(err);

            var response = {};
            bot.machine.validateAuth(req.user, req.query.password, function (isAuthenticated) {
                if (isAuthenticated)
                    response = bot;
                res.json(response);
            });
        });
    }
    else {
        errorHelpers.returnError_get_noId(res);
    }
});

router.patch('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params._id) {

    }
    else {
        errorHelpers.returnError_noId(res);
    }
});

module.exports = router;