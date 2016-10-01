/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');

var Machine = require('../models/machinemodels/machine');
var errorHelpers = require('../helpers/errorHelpers');

router.get('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params && req.params._id) {
        var query = {
            _id: req.params._id
        };
        getMachine(query, function (machine) {
            var response = {};
            if (machine.user.toString() == req.user._id.toString() || machine.password == req.query.password)
                response = {
                    machine: machine ? machine : {},
                    isOwner: machine && (machine.user.toString() == req.user._id.toString())
                };
            res.json(response);
        });
    }
    else {
        res.status(500).send("No machine found with supplied _id.");
    }
});

router.get('/', auth.isLoggedIn, function (req, res) {
    var response = {machine: {}};
    if (req.user._id) {

        getUserMachine(req.user, function (machine) {
            response = {
                machine: machine ? machine : {},
                isOwner: machine && (machine.user.toString() == req.user._id.toString())
            };
            res.json(response);
        })
    }
    else {
        res.json(response)
    }
});

router.patch('/', auth.isLoggedIn, function (req, res) {
    getUserMachine(req.user, function (machine) {
        var response = {
            machine: machine
        };

        if (!machine) {
            console.log("Couldn't find machine when trying to upgrade for user._id: " + req.user._id);
            errorHelpers.returnError("Failed to purchase upgrade.");
        }
        if (req.body.ip) {
            machine.refreshIP(function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                res.json(response);
            });
        }
        else if (req.body.cpu && req.body.cpu._id && req.body.cpu._id.length > 0) {
            machine.upgradeCPU(req.user, req.body.cpu._id, function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                res.json(response);
            });
        }
        else if (req.body.hdd && req.body.hdd._id && req.body.hdd._id.length > 0) {
            machine.upgradeHDD(req.user, req.body.hdd._id, function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                res.json(response);
            });
        }
        else if (req.body.internet && req.body.internet._id && req.body.internet._id.length > 0) {
            machine.upgradeInternet(req.user, req.body.internet._id, function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                res.json(response);
            });
        }
        else {
            res.json(response);
        }
    });
});

function getUserMachine(user, callback) {
    var query = {user: {_id: user._id}};
    getMachine(query, function (machine) {
        if (!machine) {
            machine = new Machine({user: user});
            machine.setDefaultRefs();
            machine.save(function (err) {
                if (err)
                    throw err;

                callback(machine);
            });
        }
        else {
            callback(machine);
        }
    });
}

function getMachine(query, callback) {
    Machine.findOne(query).populate(['cpu', 'internet', 'hdd']).exec(function (err, machine) {
        if (err)
            console.log(err);

        callback(machine);
    });
}

module.exports = router;