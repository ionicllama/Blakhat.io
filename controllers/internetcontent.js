/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');
var Machine = require('../models/machinemodels/machine');

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;

var _ = require('underscore');

router.get('/', auth.isLoggedIn, function (req, res) {
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
        Machine.findOne(query).select('_id password').exec(function (err, machine) {
            where = {
                _id: machine._id
            };
            getMachineForInternet(req.user, query, res, true);
        });
    }
    else {
        getMachineForInternet(req.user, query, res, false);
    }
});

function getMachineForInternet(user, query, res, isAuthenticated) {
    Machine.findOne(query).select('ip user bank firewall').populate('bank').exec(function (err, machine) {
        if (err) {
            console.log(err);
        }
        var resData;
        if (machine && machine.bank) {
            //this is a bank machine ip
            machine.populate("bank", function (err, machine) {
                if (err) {
                    console.log(err);
                }
                resData = {
                    machine: machine ? machine : {},
                    isAuthenticated: isAuthenticated === true,
                    isOwner: machine.user.toString() == user._id.toString()
                };
                res.json(resData);
            });
        }
        else {
            resData = {
                machine: machine ? machine : {},
                isAuthenticated: isAuthenticated === true,
                isOwner: machine && machine.user.toString() == user._id.toString()
            };
            res.json(resData);
        }
    });
}

module.exports = router;