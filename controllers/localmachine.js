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
    Machine.findOne({'user_id': req.user._id}).populate('cpu').populate('hdd').populate('internet').exec(function (err, machine) {
        if (err) {
            console.log(err);
            res.redirect('/logout');
            return;
        }
        CPU.find({}).exec(function (err, cpus) {
            if (err) {
                console.log(err);
                res.redirect('/logout');
                return;
            }
            HDD.find({}).exec(function (err, hdds) {
                if (err) {
                    console.log(err);
                    res.redirect('/logout');
                    return;
                }
                Internet.find({}).exec(function (err, internets) {
                    if (err) {
                        console.log(err);
                        res.redirect('/logout');
                        return;
                    }

                    res.locals = _.extend({}, res.locals, {
                        page: 'localmachine',
                        machine: machine,
                        machineParts: {
                            cpus: cpus,
                            hdds: hdds,
                            internets: internets
                        }
                    });

                    if (!machine) {
                        machine = new Machine({user_id: req.user._id});
                        machine.setDefaultRefs();
                        machine.save(function (err) {
                            if (err) {
                                console.log(err);
                                res.redirect('/logout');
                                return;
                            }

                            res.locals.machine = machine;
                            res.render('pages/index');
                        });
                    }
                    else {
                        machine.setDefaultRefs();
                        res.render('pages/index');
                    }
                });
            })
        });
    });
});

module.exports = router;