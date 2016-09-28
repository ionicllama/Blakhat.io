/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');

var AjaxResponse = require('../models/ajaxresponse');
var Machine = require('../models/machinemodels/machine');
var errorHelpers = require('../helpers/errorHelpers');

router.get('/', auth.isLoggedIn, function (req, res) {
    var query = {user_id: req.user._id};
    if (req._id) {
        query = {_id: req._id};
    }
    getUserMachine(req.user, query, function (machine) {
        res.send(JSON.stringify(machine));
    });
});

router.patch('/', auth.isLoggedIn, function (req, res) {
    getUserMachine(req.user, {'user_id': req.user._id}, function (machine) {
        if (!machine) {
            machine = new Machine({user_id: user._id});
            machine.setDefaultRefs();
        }

        if (req.body.ip) {
            machine.refreshIP(function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                var response = new AjaxResponse(machine);
                res.send(response.getResponse());
            });
        }
        else if (req.body.cpu && req.body.cpu._id && req.body.cpu._id.length > 0) {
            machine.upgradeCPU(req.user, req.body.cpu._id, function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                var response = new AjaxResponse(machine);
                res.send(response.getResponse());
            });
        }
        else if (req.body.hdd && req.body.hdd._id && req.body.hdd._id.length > 0) {
            machine.upgradeHDD(req.user, req.body.hdd._id, function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                var response = new AjaxResponse(machine);
                res.send(response.getResponse());
            });
        }
        else if (req.body.internet && req.body.internet._id && req.body.internet._id.length > 0) {
            machine.upgradeInternet(req.user, req.body.internet._id, function (err) {
                if (err) {
                    errorHelpers.returnError(err);
                    return;
                }

                var response = new AjaxResponse(machine);
                res.send(response.getResponse());
            });
        }
        else {
            throw new Error("No cpu specified.");
        }
    });
});

function getUserMachine(user, query, callback) {
    Machine.findOne(query).populate('cpu').populate('internet').populate('hdd').exec(function (err, machine) {
        if (err)
            throw err;

        if (!machine) {
            machine = new Machine({user_id: user._id});
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

module.exports = router;