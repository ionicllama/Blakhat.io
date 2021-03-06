/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var CPU = require('../models/machinemodels/cpu');
var GPU = require('../models/machinemodels/gpu');
var HDD = require('../models/machinemodels/hdd');
var ExternalHDD = require('../models/machinemodels/externalhdd');
var Internet = require('../models/machinemodels/internet');

var auth = require('../middlewares/authMiddleware');

var errorHelpers = require('../helpers/errorHelpers');

router.get('/cpus/', auth.isLoggedIn, function (req, res) {
    var response = [];
    CPU.find({}).exec(function (err, cpus) {
        if (err)
            console.log(err);

        if (cpus)
            response = cpus;

        res.json(response);
    });
});

router.get('/gpus/', auth.isLoggedIn, function (req, res) {
    var response = [];
    GPU.find({}).exec(function (err, gpus) {
        if (err)
            console.log(err);

        if (gpus)
            response = gpus;

        res.json(response);
    });
});

router.get('/hdds/', auth.isLoggedIn, function (req, res) {
    var response = [];
    HDD.find({}).exec(function (err, hdds) {
        if (err)
            console.log(err);

        if (hdds)
            response = hdds;

        res.json(response);
    });
});

router.get('/externalhdds/', auth.isLoggedIn, function (req, res) {
    var response = [];
    ExternalHDD.find({}).exec(function (err, externalHDDs) {
        if (err)
            console.log(err);

        if (externalHDDs)
            response = externalHDDs;

        res.json(response);
    });
});

router.get('/internets/', auth.isLoggedIn, function (req, res) {
    var response = [];
    Internet.find({}).exec(function (err, internets) {
        if (err)
            console.log(err);

        if (internets)
            response = internets;

        res.json(response);
    });
});

module.exports = router;