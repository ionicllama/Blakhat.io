/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');
var Machine = require('../models/machinemodels/machine');

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;
var errorHelpers = require('../helpers/errorHelpers');

var _ = require('underscore');

router.get('/', auth.isLoggedIn, function (req, res) {
    if (!req.query.source || req.query.source.length == 0)
        errorHelpers.returnError("No source IP address found.  Make sure you own at least 1 machine.", res);

    Machine.findForInternet(req.query.search, req.user, function (err, machine) {
        if (err)
            console.log(err);

        var response = {
            machine: machine ? machine : {},
            isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
        };
        if (req.query.password) {
            response.isAuthenticated = machine.validateAuth(req.user, req.query.password);

            if (response.isAuthenticated)
                machine.logAccess(req.query.source);
        }

        res.json(response);
    });
});

module.exports = router;