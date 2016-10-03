/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var Machine = require('../models/machinemodels/machine');

var auth = require('../middlewares/authMiddleware');

var errorHelpers = require('../helpers/errorHelpers');

router.get('/', auth.isLoggedIn, function (req, res) {
    var response = {machine: {}};
    if (req.user._id) {

        Machine.findByUserPopulated(req.user, function (err, machine) {
            if (err)
                return errorHelpers.returnError("Failed to initialize this machine.  Please try again later.");

            response = {
                machine: machine ? machine : {},
                isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
            };
            res.json(response);
        })
    }
    else {
        res.json(response)
    }
});

router.get('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params && req.params._id) {
        Machine.findByIdPopulated(req.params._id, function (err, machine) {
            if (err)
                console.log(err);

            var response = {};
            if (machine && (machine.user && machine.user.toString() == req.user._id.toString()) || machine.password == req.query.password) {
                response = {
                    machine: machine ? machine : {},
                    isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
                };
            }
            res.json(response);
        });
    }
    else {
        errorHelpers.returnError_get_noId(res);
    }
});

router.patch('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params._id) {
        Machine.findByIdPopulated(req.params._id, function (err, machine) {
            if (err)
                return errorHelpers.returnError("Failed to update machine.", res, err);
            else if (!machine)
                return errorHelpers.returnError("No existing machine with supplied _id.", res);

            var response = {
                machine: machine
            };

            if (!machine.validateAuth(req.user, req.body.password))
                return errorHelpers.returnError("You don't have permission to update this.", res);

            if (req.body.log != null) {
                machine.updateLog(req.body.log, function (err) {
                    if (err) {
                        errorHelpers.returnError(UIError, res, err);
                        return;
                    }
                    res.json(response);
                });
            }
            else if (req.body.ip != null) {
                machine.refreshIP(function (UIError, err) {
                    if (err || UIError) {
                        errorHelpers.returnError(UIError, res, err);
                        return;
                    }
                    res.json(response);
                });
            }
            else if (req.body.password != null) {
                machine.resetPassword(function (UIError, err) {
                    if (err || UIError) {
                        errorHelpers.returnError(UIError, res, err);
                        return;
                    }
                    res.json(response);
                });
            }
            else if (req.body.cpu && req.body.cpu._id && req.body.cpu._id.length > 0) {
                machine.upgradeCPU(req.user, req.body.cpu._id, function (UIError, err) {
                    if (err || UIError) {
                        errorHelpers.returnError(UIError, res, err);
                        return;
                    }
                    res.json(response);
                });
            }
            else if (req.body.hdd && req.body.hdd._id && req.body.hdd._id.length > 0) {
                machine.upgradeHDD(req.user, req.body.hdd._id, function (UIError, err) {
                    if (err || UIError) {
                        errorHelpers.returnError(UIError, res, err);
                        return;
                    }
                    res.json(response);
                });
            }
            else if (req.body.internet && req.body.internet._id && req.body.internet._id.length > 0) {
                machine.upgradeInternet(req.user, req.body.internet._id, function (UIError, err) {
                    if (err || UIError) {
                        errorHelpers.returnError(UIError, res, err);
                        return;
                    }
                    res.json(response);
                });
            }
            else {
                res.json(response);
            }
        });
    }
    else {
        errorHelpers.returnError_noId(res);
    }
});

module.exports = router;