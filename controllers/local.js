/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');
var Machine = require('../models/machinemodels/machine');
var CPU = require('../models/machinemodels/cpu');

router.get('/', auth.isLoggedIn, function (req, res) {
    Machine.findOne({'user_id': req.user._id}).populate('cpu').exec(function (err, machine) {
        if (err)
            throw err;
        CPU.find({}).exec(function (err, cpus) {
            if (!machine) {
                machine = new Machine({user_id: req.user._id});
                machine.setDefaultRefs();
                machine.save(function (err) {
                    if (err)
                        throw err;

                    res.render('pages/local', {machine: machine, cpus: cpus});
                });
            }
            else {
                res.render('pages/local', {machine: machine, cpus: cpus});
            }
        });
    });
});

module.exports = router;