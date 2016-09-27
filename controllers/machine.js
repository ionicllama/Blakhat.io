/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var auth = require('../middlewares/authMiddleware');
var AjaxResponse = require('../models/ajaxresponse');
var _ = require('underscore');
var Machine = require('../models/machinemodels/machine');
var CPU = require('../models/machinemodels/cpu');

router.get('/', auth.isLoggedIn, function (req, res) {
    var query = {user_id: req.user._id};
    if (req._id) {
        query = {_id: req._id};
    }
    Machine.findOne(query).populate('cpu').exec(function (err, machine) {
        if (err)
            throw err;

        if (!machine) {
            machine = new Machine({user_id: req.user._id});
            machine.setDefaultRefs();
            machine.save(function (err) {
                if (err)
                    throw err;

                res.render(JSON.stringify(machine));
            });
        }
        else {
            res.send(JSON.stringify(machine));
        }
    });
});

router.patch('/', auth.isLoggedIn, function (req, res) {
    if (req.body.cpu && req.body.cpu._id.length > 0) {
        upgradeCPU(req.user, req.body.cpu._id, res);
    }
    else {
        throw new Error("No cpu specified.");
    }
});

function upgradeCPU(user, cpu_id, res) {
    Machine.findOne({'user_id': user._id}, function (err, machine) {
        if (err)
            throw err;

        //todo: create method for new default machines
        if (!machine) {
            machine = new Machine({user_id: user._id});
            machine.setDefaultRefs();
        }

        //todo: purchase the cpu
        if (machine.cpu._id != cpu_id) {
            CPU.findOne({'_id': cpu_id}, function (err, newCPU) {
                if (err)
                    throw err;

                var response = new AjaxResponse(200, {});

                if (newCPU) {
                    machine.cpu = newCPU;
                    machine.save(function (err) {
                        if (err)
                            throw err;

                        if (res) {
                            response = new AjaxResponse(200, machine);
                            res.end(response.getResponse());
                        }
                    });
                }
                else {
                    //todo: return error, no matching CPU

                    if (res)
                        res.end(response.getResponse());
                }
            });
        }
        else {
            throw new Error("Cores or speed were not an upgrade to existing equipment");
        }
    });
}

module.exports = router;