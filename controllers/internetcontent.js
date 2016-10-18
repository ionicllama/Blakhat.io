/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');
var Machine = require('../models/machinemodels/machine');
var Bank = require('../models/bankmodels/bank');

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;
var errorHelpers = require('../helpers/errorHelpers');

var _ = require('underscore');

router.get('/', auth.isLoggedIn, function (req, res) {
    if ((!req.query.sourceMachine) && (!req.query.bank_id || req.query.bank_id.length == 0))
        return errorHelpers.returnError("No source IP address found.  Make sure you own at least 1 machine.", res);

    var response = {machine: {}, isOwner: false},
        search = req.query.search.toLowerCase();
    if (req.query.bank_id) {
        Bank.findById(req.query.bank_id, function (err, bank) {

            if (err)
                console.log(err);

            if (bank) {
                Machine.findByBank(req.query.bank_id, function (err, machine) {
                    if (err)
                        console.log(err);

                    if (machine) {
                        response = {
                            machine: machine ? machine : {},
                            isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
                        };
                    }

                    return res.json(response);
                });
            }
            else {
                return res.json(response);
            }
        });
    }
    else {
        Machine.findByIdForInternet(req.query.sourceMachine, req.user, function (err, sourceMachine) {
            if (err)
                return errorHelpers.returnError("Unable to find machine to browse with.", res);

            if (!sourceMachine)
                return errorHelpers.returnError("Unable to find machine to browse with.", res, err);

            Machine.findBySearchForInternet(search, req.user, function (err, machineInfo) {
                if (err)
                    console.log(err);

                response = {
                    isOwner: machineInfo.machine && machineInfo.machine.user && machineInfo.machine.user.toString() == req.user._id.toString()
                };

                response = _.extend(response, machineInfo);

                if (search.toLowerCase().indexOf('login') != -1 || search.toLowerCase().indexOf('admin') != -1) {
                    machineInfo.machine.validateAuth(req.user, req.query.password, function (isAuthenticated) {
                        if (req.query.password != null || isAuthenticated)
                            response.isAuthenticated = isAuthenticated;

                        if (isAuthenticated) {
                            sourceMachine.machine.logAdminLoginTo(machineInfo.machine.ip);
                            machineInfo.machine.logAdminLoginBy(sourceMachine.machine.ip);
                        }

                        res.json(response);
                    });
                }
                else {
                    res.json(response);
                }
            });
        });
    }
});

module.exports = router;