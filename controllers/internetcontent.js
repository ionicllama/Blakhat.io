/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');
var Machine = require('../models/machinemodels/machine');

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;
var machineHelpers = require('../helpers/machineHelpers');
var errorHelpers = require('../helpers/errorHelpers');

var _ = require('underscore');

router.get('/', auth.isLoggedIn, function (req, res) {
    if (!req.query.source || req.query.source.length == 0)
        errorHelpers.returnError("No source IP address found.  Make sure you own at least 1 machine.", res);

    var parseIp = sharedHelpers.parseIPFromString(req.query.search),
        query = {
            ip: req.query.search
        };

    if (parseIp && parseIp.length > 0) {
        query = {
            ip: parseIp
        }
    }
    if (req.query.password) {
        Machine.findOne(query).select('_id password log').exec(function (err, machine) {
            where = {
                _id: machine._id
            };
            var isAuthenticated = false;
            if (req.query.password === machine.password) {
                isAuthenticated = true;
                machineHelpers.logMachineAccess(machine, req.query.source);
            }
            getMachineForInternet(req.user, query, res, isAuthenticated);
        });
    }
    else {
        getMachineForInternet(req.user, query, res);
    }
});

function getMachineForInternet(user, query, res, isAuthenticated) {
    Machine.findOne(query).select('ip user bank firewall').populate('bank').exec(function (err, machine) {
        if (err) {
            console.log(err);
        }
        var resData = {
            machine: machine ? machine : {},
            isOwner: machine && machine.user.toString() == user._id.toString()
        };
        if (isAuthenticated != null)
            resData.isAuthenticated = isAuthenticated;

        if (machine && machine.bank) {
            //this is a bank machine ip
            machine.populate("bank", function (err, machine) {
                if (err) {
                    console.log(err);
                }
                res.json(resData);
            });
        }
        else {
            res.json(resData);
        }
    });
}

module.exports = router;