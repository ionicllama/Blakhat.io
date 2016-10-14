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
    if ((!req.query.source || req.query.source.length == 0) && (!req.query.bank_id || req.query.bank_id.length == 0))
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
        Machine.findForInternet(search, req.user, function (err, machine) {
            if (err)
                console.log(err);

            response = {
                machine: machine ? machine : {},
                isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
            };

            if (search.toLowerCase().indexOf('login') != -1 || search.toLowerCase().indexOf('admin') != -1) {
                machine.validateAuth(req.user, req.query.password, function (isAuthenticated) {
                    if (req.query.password != null || isAuthenticated)
                        response.isAuthenticated = isAuthenticated;

                    if (isAuthenticated)
                        machine.logAdminLogin(req.query.source);

                    res.json(response);
                });
            }
            else {
                res.json(response);
            }
        });
    }
});

module.exports = router;