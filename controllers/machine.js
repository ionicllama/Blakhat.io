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

var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;
var errorHelpers = require('../helpers/errorHelpers');


router.get('/', auth.isLoggedIn, function (req, res) {
    var response = {machine: {}};
    if (req.user._id) {

        Machine.findByUserPopulated(req.user, function (err, machine) {
            if (err)
                return errorHelpers.returnError("Failed to initialize this machine.  Please try again later.", res, err);

            var fileStats = machine.getFileStats();
            //filter out hidden files where the hider level > the current machine's finder
            //if a user needs to find a hidden file on a remote machine, they need to upload a seeker
            machine.files = machine.files.filter(function (file) {
                return file.hidden === null || file.hidden <= fileStats.finder;
            });
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
            machine.validateAuth(req.user, req.query.password, function (isAuthenticated) {
                if (isAuthenticated) {
                    var fileStats = machine.getFileStats();
                    //filter out hidden files where the hider level > the current machine's finder
                    //if a user needs to find a hidden file on a remote machine, they need to upload a seeker
                    machine.files = machine.files.filter(function (file) {
                        return file.hidden === null || file.hidden <= fileStats.finder;
                    });
                    response = {
                        machine: machine ? machine : {},
                        isOwner: machine && machine.user && machine.user.toString() == req.user._id.toString()
                    };
                }
                res.json(response);
            });
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

            var fileStats = machine.getFileStats();
            //filter out hidden files where the hider level > the current machine's finder
            //if a user needs to find a hidden file on a remote machine, they need to upload a seeker
            machine.files = machine.files.filter(function (file) {
                return file.hidden === null || file.hidden <= fileStats.finder;
            });

            var response = {
                machine: machine
            };

            machine.validateAuth(req.user, req.body.password, function (isAuthenticated) {
                if (!isAuthenticated)
                    return errorHelpers.returnError("You don't have admin permissions for this machine.", res);

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
                            return errorHelpers.returnError("Failed to purchase upgrade.", res, err);
                        }
                    });
                }
                else {
                    return errorHelpers.returnError("Failed to find action with provided data.", res, err);
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

            var processOpts = {
                path: 'processes',
                populate: [{path: 'file', populate: {path: 'fileDef'}}, {
                    path: 'machine',
                    select: '_id ip'
                }, 'bankAccount']
            };
            machine.populate(processOpts, function (err, machine) {
                if (err || !machine)
                    return errorHelpers.returnError("Unable to find processes for requested machine.", res, err ? err : null);

                return res.json(machine.processes);
            });
        });
    }
    else {
        return errorHelpers.returnError("Unable to find processes for requested machine.", res);
    }
});

router.patch('/:machine_id/process/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params.machine_id)
        return errorHelpers.returnError("No machine id was provided to start the process on", res);
    else if (!req.params._id)
        return errorHelpers.returnError_noId(res);

    Machine.findByIdPopulated(req.params.machine_id, function (err, processMachine) {
        if (err)
            return errorHelpers.returnError("Failed to find a machine to start the process on", res, err);

        var process = _.find(processMachine.processes, function (process) {
            return process._id.toString() === req.params._id.toString();
        });

        if (!process)
            return errorHelpers.returnError("Failed to find a process with provided id", res);

        //if this process has already been executed, this call is to restart the process
        var populate = [
            {
                path: 'file',
                populate: {
                    path: 'fileDef'
                }
            },
            {
                path: 'machine',
                populate: {
                    path: 'files',
                    populate: {
                        path: 'fileDef'
                    }
                }
            }
        ];
        Process.populate(process, populate, function (err, process) {
            if (err)
                return errorHelpers.returnError("Failed to find a process with provided id", res, err);

            if (process.processSuccess != null) {
                process.processSuccess = null;
                process.start = new Date();
                process.end = null;
                processMachine.updateProcessCosts(function (UIError, err) {
                    if (UIError || err)
                        return errorHelpers.returnError("Failed to restart process", res, err);
                    processMachine.save(function (err) {
                        if (err)
                            return errorHelpers.returnError("Failed to restart process", res, err);

                        res.json(process);
                    });
                });
            }
            else {
                process.execute(req.user, processMachine, function (UIError, err) {
                    if (UIError || err)
                        return errorHelpers.returnError(UIError, res, err);

                    processMachine.updateProcessCosts(function (err) {
                        if (err)
                            return errorHelpers.returnError("Failed to execute the selected process", res, err);

                        res.json(process);
                    });
                });
            }
        })
    });
});

router.post('/:machine_id/process/', auth.isLoggedIn, function (req, res) {
    if (!req.params.machine_id)
        return errorHelpers.returnError("No machine id was provided to start the process on", res);

    if (req.body.type == null)
        return errorHelpers.returnError("No job type provided", res);

    Machine.findByIdPopulated(req.params.machine_id, function (err, processMachine) {
        if (err || !processMachine)
            return errorHelpers.returnError("Failed to find a machine to start the process on", res, err);
        else if ((!processMachine.user || processMachine.user.toString() != req.user._id.toString()))
            return errorHelpers.returnError("You don't have permission to start processes on this machine.", res);

        switch (req.body.type) {
            case sharedHelpers.processHelpers.types.UPDATE_LOG:
                if (!req.body.machine_id)
                    return errorHelpers.returnError("No machine provided to update log on.", res);

                Machine.findByIdPopulated(req.body.machine_id, function (err, machine) {
                    if (err || !machine)
                        return errorHelpers.returnError("No machine could be found to update log on.", res, err);

                    machine.validateAuth(req.user, req.body.password, function (isAuthenticated) {
                        if (!isAuthenticated)
                            return errorHelpers.returnError("You don't have permission to update the log on this machine.", res);

                        var newProcess = new Process({
                            machine: machine._id,
                            type: req.body.type,
                            start: new Date(),
                            log: req.body.log
                        });

                        saveProcess(processMachine, newProcess, res);
                    });
                });
                break;
            case sharedHelpers.processHelpers.types.CRACK_PASSWORD_MACHINE:
                Machine.findByIdPopulated(req.body.machine_id, function (err, machine) {
                    if (err || !machine)
                        return errorHelpers.returnError("No machine could be found to crack password.", res, err);

                    var fileStatsP = processMachine.getFileStats(),
                        fileStatsC = machine.getFileStats();

                    if (fileStatsC.firewall > fileStatsP.firewall)
                        return errorHelpers.returnError("Your firewall bypasser level is too low to crack this machine's admin password.", res, err);

                    var newProcess = new Process({
                        machine: machine._id,
                        type: req.body.type,
                        start: new Date()
                    });
                    saveProcess(processMachine, newProcess, res);
                });
                break;
            case sharedHelpers.processHelpers.types.FILE_DOWNLOAD:
                if (!req.body.machine_id)
                    return errorHelpers.returnError("No machine provided to download file from.", res);
                else if (!req.body.file)
                    return errorHelpers.returnError("No file selected to download.", res);
                Machine.findByIdPopulated(req.body.machine_id, function (err, machine) {
                    if (err || !machine)
                        return errorHelpers.returnError("No machine could be found to download file from.", res, err);

                    var downloadFile = _.find(machine.files, function (file) {
                        return file._id.toString() === req.body.file._id.toString();
                    });

                    if (!downloadFile)
                        return errorHelpers.returnError("The selected file no longer exists.", res);

                    var usedSpace = sharedHelpers.fileHelpers.getFilesSizeTotal(processMachine.files);
                    if (downloadFile.fileDef.size > (processMachine.hdd.size - usedSpace))
                        return errorHelpers.returnError("Not enough space on your hard drive to download this file.", res);

                    machine.validateAuth(req.user, req.body.password, function (isAuthenticated) {
                        if (!isAuthenticated)
                            return errorHelpers.returnError("You don't have permission to download this file.", res);

                        var newProcess = new Process({
                            machine: machine._id,
                            type: req.body.type,
                            start: new Date(),
                            file: downloadFile._id
                        });

                        saveProcess(processMachine, newProcess, res);
                    });
                });
                break;
            case sharedHelpers.processHelpers.types.FILE_UPLOAD:
                if (!req.body.machine_id)
                    return errorHelpers.returnError("No machine provided to upload file to.", res);
                else if (!req.body.file)
                    return errorHelpers.returnError("No file selected to upload.", res);
                Machine.findByIdPopulated(req.body.machine_id, function (err, machine) {
                    if (err || !machine)
                        return errorHelpers.returnError("No machine could be found to upload file to.", res, err);

                    var uploadFile = _.find(processMachine.files, function (file) {
                        return file._id.toString() === req.body.file._id.toString();
                    });

                    if (!uploadFile)
                        return errorHelpers.returnError("The selected file no longer exists.", res);

                    var usedSpace = sharedHelpers.fileHelpers.getFilesSizeTotal(machine.files);
                    if (uploadFile.fileDef.size > (machine.hdd.size - usedSpace))
                        return errorHelpers.returnError("Not enough space on destination machine's hard drive to upload this file.", res);

                    machine.validateAuth(req.user, req.body.password, function (isAuthenticated) {
                        if (!isAuthenticated)
                            return errorHelpers.returnError("You don't have permission to upload files to this machine.", res);

                        var newProcess = new Process({
                            machine: machine._id,
                            type: req.body.type,
                            start: new Date(),
                            file: uploadFile._id
                        });

                        saveProcess(processMachine, newProcess, res);
                    });
                });
                break;
            case sharedHelpers.processHelpers.types.FILE_INSTALL:
                if (!req.body.machine_id)
                    return errorHelpers.returnError("No machine provided to install file on.", res);
                else if (!req.body.file)
                    return errorHelpers.returnError("No file selected to install.", res);
                Machine.findByIdPopulated(req.body.machine_id, function (err, machine) {
                    if (err || !machine)
                        return errorHelpers.returnError("No machine could be found to install file on.", res, err);

                    var installFile = _.find(machine.files, function (file) {
                        return file._id.toString() === req.body.file._id.toString() && !file.isInstalled;
                    });

                    if (!installFile)
                        return errorHelpers.returnError("The selected file no longer exists.", res);

                    machine.validateAuth(req.user, req.body.password, function (isAuthenticated) {
                        if (!isAuthenticated)
                            return errorHelpers.returnError("You don't have permission to install files on this machine.", res);

                        var newProcess = new Process({
                            machine: machine._id,
                            type: req.body.type,
                            start: new Date(),
                            file: installFile._id
                        });

                        saveProcess(processMachine, newProcess, res);
                    });
                });
                break;
            case sharedHelpers.processHelpers.types.FILE_RUN:
                if (!req.body.machine_id)
                    return errorHelpers.returnError("No machine provided to run file on.", res);
                else if (!req.body.file)
                    return errorHelpers.returnError("No file selected to run.", res);
                Machine.findByIdPopulated(req.body.machine_id, function (err, machine) {
                    if (err || !machine)
                        return errorHelpers.returnError("No machine could be found to run file on.", res, err);

                    var runFile = _.find(machine.files, function (file) {
                        return file._id.toString() === req.body.file._id.toString() && !file.isInstalled;
                    });

                    if (!runFile)
                        return errorHelpers.returnError("The selected file no longer exists.", res);

                    machine.validateAuth(req.user, req.body.password, function (isAuthenticated) {
                        if (!isAuthenticated)
                            return errorHelpers.returnError("You don't have permission to run files on this machine.", res);

                        var newProcess = new Process({
                            machine: machine._id,
                            type: req.body.type,
                            start: new Date(),
                            file: runFile._id
                        });

                        saveProcess(processMachine, newProcess, res);
                    });
                });
                break;
            default:
                return errorHelpers.returnError("No valid job type provided");
        }
    });
});

function saveProcess(processMachine, newProcess, res) {
    newProcess.save(function (err) {
        if (err)
            return errorHelpers.returnError("Failed to start process", res, err);

        processMachine.processes.push(newProcess);
        processMachine.updateProcessCosts(function (UIError, err) {
            if (UIError || err)
                return errorHelpers.returnError("Failed to start process", res, err);
            processMachine.save(function (err) {
                if (err)
                    return errorHelpers.returnError("Failed to start process", res, err);

                res.json(newProcess);
            });
        });
    });
}

router.delete('/:machine_id/process/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params.machine_id)
        return errorHelpers.returnError("No machine id was provided to start the process on", res);
    else if (!req.params._id)
        return errorHelpers.returnError_noId(res);

    Machine.findByIdPopulated(req.params.machine_id, function (err, machine) {
        if (err)
            return errorHelpers.returnError("Failed to find a machine with the provided id.", res, err);
        else if (!machine)
            return errorHelpers.returnError("No machine could be found with provided id.", res);
        else if (machine.user.toString() != req.user._id.toString())
            return errorHelpers.returnError("You don't have permission to delete this process.", res);

        var process = _.find(machine.processes, function (process) {
            return process._id.toString() === req.params._id.toString();
        });

        if (!process)
            return errorHelpers.returnError("Failed to find a process with the provided id.", res, err);

        machine.processes.pull(process._id);
        machine.save(function (err) {
            if (err)
                return errorHelpers("Failed to delete the selected process", err, res);
            process.remove(function () {
                if (err)
                    return errorHelpers("Failed to delete the selected process", err, res);
                machine.updateProcessCosts(function (err) {
                    if (err)
                        console.log(err);

                    process.processSuccess = true;
                    res.json(process);
                });
            });
        });
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

            res.json(machine.files);
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

            var deleteFile = _.find(machine.files, function (file) {
                return file && file._id.toString() === req.params._id.toString();
            });

            if (!deleteFile)
                return errorHelpers.returnError("Couldn't find file with supplied _id", res);
            else if (deleteFile.isLocked)
                return errorHelpers.returnError("You don't have permission to delete this file.", res);

            machine.files.pull(deleteFile._id);
            machine.save(function (err) {
                if (err)
                    return errorHelpers("Failed to delete the selected file", err, res);

                deleteFile.remove(function (err) {
                    if (err)
                        console.log(err);

                    res.json(deleteFile);
                });
            });
        });
    });
});

module.exports = router;