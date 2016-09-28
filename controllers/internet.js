/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');
var Machine = require('../models/machinemodels/machine');
var CPU = require('../models/machinemodels/cpu');
var HDD = require('../models/machinemodels/hdd');
var Internet = require('../models/machinemodels/internet');

var _ = require('underscore');

router.get('/', auth.isLoggedIn, function (req, res) {
    res.locals = _.extend({}, res.locals, {
        page: 'internet'
    });
    res.render('pages/index')
});

module.exports = router;