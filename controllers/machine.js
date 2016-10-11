/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var _ = require('underscore');

var Machine = require('../models/machinemodels/machine');
var Process = require('../models/machinemodels/process');
var File = require('../models/filemodels/file');
var BankAccount = require('../models/bankmodels/bankaccount');

var auth = require('../middlewares/authMiddleware');

var errorHelpers = require('../helpers/errorHelpers');


router.get('/', auth.isLoggedIn, function (req, res) {
    var response = {machine: {}};
    if (req.user._id) {

        Machine.findByUserPopulated(req.user, function (err, machine) {
            if (err)
                return errorHelpers.returnError("Failed to initialize this machine.  Please try again later.");

            response = {
                machine: machine ? machine : {},
                isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
            };
            res.json(response);
        })
    }
    else {
        res.json(response)
    }
});

router.get('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params && req.params._id) {
        Machine.findByIdPopulated(req.params._id, function (err, machine) {
            if (err)
                console.log(err);

            var response = {};
            if (machine && (machine.user && machine.user.toString() == req.user._id.toString()) || machine.password == req.query.password) {
                response = {
                    machine: machine ? machine : {},
                    isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
                };
            }
            res.json(response);
        });
    }
    else {
        errorHelpers.returnError_get_noId(res);
    }
});

router.patch('/:_id', auth.isLoggedIn, function (req, res) {
    if (req.params._id) {
        Machine.findByIdPopulated(req.params._id, function (err, machine) {
            if (err)
                return errorHelpers.returnError("Failed to update machine.", res, err);
            else if (!machine)
                return errorHelpers.returnError("No existing machine with supplied _id.", res);

            var response = {
                machine: machine
            };

            machine.validateAuth(req.user, req.body.password, function (isAuthenticated) {
                if (!isAuthenticated)
                    return errorHelpers.returnError("You don't have permission to update this.", res);

                if (req.body.log != null) {
                    machine.updateLog(req.body.log, false, function (err) {
                        if (err) {
                            errorHelpers.returnError(UIError, res, err);
                            return;
                        }
                        res.json(response);
                    });
                }
                else if (req.body.ip != null) {
                    machine.refreshIP(function (UIError, err) {
                        if (err || UIError) {
                            errorHelpers.returnError(UIError, res, err);
                            return;
                        }
                        res.json(response);
                    });
                }
                else if (req.body.password != null) {
                    machine.resetPassword(function (UIError, err) {
                        if (err || UIError) {
                            errorHelpers.returnError(UIError, res, err);
                            return;
                        }
                        res.json(response);
                    });
                }
                else if (req.body.purchaseAccount) {
                    BankAccount.findById(req.body.purchaseAccount._id, function (err, bankAccount) {
                        if (err || !bankAccount)
                            return errorHelpers.returnError("Failed to purchase upgrade.", res, err);


                        if (req.body.cpu && req.body.cpu._id && req.body.cpu._id.length > 0) {
                            machine.upgradeCPU(req.user, bankAccount, req.body.cpu._id, function (UIError, err) {
                                if (err || UIError) {
                                    errorHelpers.returnError(UIError, res, err);
                                    return;
                                }
                                res.json(response);
                            });
                        }
                        else if (req.body.hdd && req.body.hdd._id && req.body.hdd._id.length > 0) {
                            machine.upgradeHDD(req.user, bankAccount, req.body.hdd._id, function (UIError, err) {
                                if (err || UIError) {
                                    errorHelpers.returnError(UIError, res, err);
                                    return;
                                }
                                res.json(response);
                            });
                        }
                        else if (req.body.internet && req.body.internet._id && req.body.internet._id.length > 0) {
                            machine.upgradeInternet(req.user, bankAccount, req.body.internet._id, function (UIError, err) {
                                if (err || UIError) {
                                    errorHelpers.returnError(UIError, res, err);
                                    return;
                                }
                                res.json(response);
                            });
                        }
                        else {
                            res.json(response);
                        }
                    });
                }
                else {
                    res.json(response);
                }
            });
        });
    }
    else {
        errorHelpers.returnError_noId(res);
    }
});

//Processes
router.get('/:machine_id/processes', auth.isLoggedIn, function (req, res) {
    if (req.params.machine_id) {
        Machine.findById(req.params.machine_id, function (err, machine) {
            if (err || !machine)
                return errorHelpers.returnError("Unable to find processes for requested machine.", res, err ? err : null);
            else if (machine.user.toString() != req.user._id.toString())
                return errorHelpers.returnError("Can't view processes for this machine, you don't own it.", res);

            Process.findByMachine(machine._id, function (err, processes) {
                if (err || !processes)
                    return errorHelpers.returnError("Unable to find processes for requested machine.", res, err ? err : null);

                return res.json(processes);
            });

        });
    }
    else {
        return errorHelpers.returnError("Unable to find processes for requested machine.", res);
    }
});

router.post('/:machine_id/process/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.body.machine)
        return errorHelpers.returnError("No machine was provided to start the process on", res);

    if (!req.body.machinePasswordCrack || !req.body.bankPasswordCrack || !req.body.file)
        return errorHelpers.returnError("No job provided for the process");

    Machine.findByIdPopulated(req.body.machine._id, function (err, machine) {
        if (err)
            return errorHelpers.returnError("Failed to find a machine to start the process on", res, err);

        var newProcess = new Process({
            machine: machine,
            start: new Date()
        });
        if (req.body.machinePasswordCrack) {
            newProcess.machinePasswordCrack = req.body.machinePasswordCrack;
        }
        else if (req.body.bankPasswordCrack) {
            newProcess.bankPasswordCrack = req.body.bankPasswordCrack;
        }
        else if (req.body.file) {
            newProcess.file = req.body.file;
        }
    });
});

//Files
router.get('/:machine_id/files', auth.isLoggedIn, function (req, res) {
    if (req.params.machine_id) {
        Machine.findWithFiles(req.params.machine_id, function (err, machine) {
            if (err || !machine)
                return errorHelpers.returnError("Unable to find files for requested machine.", res, err ? err : null);
            else if (machine.user.toString() != req.user._id.toString() || (req.query.password && req.query.password === machine.password))
                return errorHelpers.returnError("Can't view files for this machine, you don't have permission.", res);
        });
    }
    else {
        return errorHelpers.returnError("Unable to find files for requested machine.", res);
    }
});

router.delete('/:machine_id/file/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params.machine_id || !req.params._id)
        return errorHelpers.returnError_noId(res);

    Machine.findWithSingleFile(req.params.machine_id, req.params._id, function (err, machine) {
        if (err)
            return errorHelpers.returnError("Couldn't find machine with supplied _id.", res, err);
        else if (!machine)
            return errorHelpers.returnError("Couldn't find machine with supplied _id.", res);

        var password = "";
        if (req.query.password)
            password = req.query.password;

        machine.validateAuth(req.user, password, function (isAuthenticated) {
            if (!isAuthenticated)
                return errorHelpers.returnError("You don't have permission to delete this file.", res);

            var file = _.find(machine.files, function (file) {
                return file.file._id.toString() === req.params._id.toString();
            });

            if (!file)
                return errorHelpers.returnError("Couldn't find file with supplied _id", res);
            else if (file.isLocked)
                return errorHelpers.returnError("You don't have permission to delete this file.", res);

            machine.files.pull({file: {_id: file._id}});
            machine.save(function (err) {
                if (err)
                    return errorHelpers("Failed to delete the selected file", err, res);

                res.end();
            });
        });
    });
});

module.exports = router;