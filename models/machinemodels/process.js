/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var Machine = require('../../models/machinemodels/machine');
var Bot = require('../../models/machinemodels/bot');
var File = require('../../models/filemodels/file');

var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var globalHelpers = require('../../helpers/globalHelpers');

var processSchema = mongoose.Schema({

    start: {type: Date, default: new Date()},
    end: {type: Date, default: null},
    type: {type: Number, default: null},
    file: {type: mongoose.Schema.Types.ObjectId, ref: 'file', default: null},
    log: {type: String, default: null},
    machine: {type: mongoose.Schema.Types.ObjectId, ref: 'machine', default: null},
    bankAccount: {type: mongoose.Schema.Types.ObjectId, ref: 'bankaccount', default: null},
    processSuccess: {type: Boolean, default: null},
    failureReason: {type: String, default: null}

});

processSchema.statics = {
    types: {
        CRACK_PASSWORD_MACHINE: sharedHelpers.processHelpers.types.CRACK_PASSWORD_MACHINE,
        CRACK_PASSWORD_BANK: sharedHelpers.processHelpers.types.CRACK_PASSWORD_BANK,
        FILE_DOWNLOAD: sharedHelpers.processHelpers.types.FILE_DOWNLOAD,
        FILE_UPLOAD: sharedHelpers.processHelpers.types.FILE_UPLOAD,
        FILE_INSTALL: sharedHelpers.processHelpers.types.FILE_INSTALL,
        FILE_RUN: sharedHelpers.processHelpers.types.FILE_RUN,
        UPDATE_LOG: sharedHelpers.processHelpers.types.UPDATE_LOG
    },
    basicCosts: {
        UPDATE_LOG: 180
    },
    findByMachine: function (_id, callback) {
        this.find({processMachine: {_id: _id}}).populate(['machine', 'bankAccount']).exec(function (err, processes) {
            if (err)
                return callback(err);

            processes = processes.filter(function (process) {
                return process.type != null && (process.file != null && process.machine != null) ||
                    process.bankAccount != null ||
                    (process.log != null && process.machine != null);
            });

            return callback(null, processes);
        });
    }

};

processSchema.methods = {
    execute: function (user, processMachine, callback) {
        if (new Date(this.end) > new Date())
            return callback("Failed to execute the selected process, its not complete yet.", null);

        var processTypes = this.model('process').types,
            self = this;
        switch (this.type) {
            case processTypes.UPDATE_LOG:
                var startDate = new Date(this.start);
                if (new Date(this.machine.lastLogUpdate) > startDate) {
                    this.processSuccess = false;
                    this.failureReason = "Another user updated the log before you";
                    this.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);

                        return callback();
                    });
                }
                else {
                    //todo: maybe fail sometimes randomly
                    this.processSuccess = true;
                    this.machine.updateLog(this.log ? this.log : "", false, startDate, function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);

                        self.save(function (err) {
                            if (err)
                                return callback("Failed to execute the selected process", err);

                            return callback();
                        });
                    })
                }
                break;
            case processTypes.FILE_DOWNLOAD:
                if (!this.file)
                    return callback("Couldn't find file to download");

                var usedDownloadSpace = sharedHelpers.fileHelpers.getFilesSizeTotal(processMachine.files);
                if (this.file.fileDef.size > (processMachine.hdd.size - usedDownloadSpace))
                    return callback("Not enough space on your hard drive to download this file.", res);

                //todo: maybe fail sometimes randomly
                this.processSuccess = true;
                var downloadFile = new File({
                    name: null,
                    fileDef: this.file.fileDef,
                    isLocked: false
                });

                processMachine.logFileDownloadFrom(this.machine.ip, downloadFile);
                this.machine.logFileDownloadBy(processMachine.ip, downloadFile);

                downloadFile.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    processMachine.files.push(downloadFile);
                    processMachine.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);

                        self.save(function (err) {
                            if (err)
                                return callback("Failed to execute the selected process", err);

                            return callback();
                        })
                    });
                });
                break;
            case processTypes.FILE_UPLOAD:
                if (!this.file)
                    return callback("Couldn't find file to upload");

                var usedUploadSpace = sharedHelpers.fileHelpers.getFilesSizeTotal(this.machine.files);
                if (this.file.fileDef.size > (this.machine.hdd.size - usedUploadSpace))
                    return callback("Not enough space on destination machine's hard drive to upload this file.", res);

                //todo: maybe fail sometimes randomly
                this.processSuccess = true;
                var uploadFile = new File({
                    name: null,
                    fileDef: this.file.fileDef,
                    isLocked: false
                });

                processMachine.logFileUploadTo(this.machine.ip, uploadFile);
                this.machine.logFileUploadFrom(processMachine.ip, uploadFile);

                uploadFile.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    self.machine.files.push(uploadFile);
                    self.machine.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);

                        self.save(function (err) {
                            if (err)
                                return callback("Failed to execute the selected process", err);

                            return callback();
                        })
                    });
                });
                break;
            case processTypes.FILE_INSTALL:
                if (!this.file)
                    return callback("File install failed: Couldn't find file to install");
                else if (this.file.isInstalled)
                    return callback("File install failed: File already installed");
                else if (!this.file.fileDef.canInstall())
                    return callback("File install failed: Installation not supported with this file type");

                processMachine.logInstallFileTo(this.machine.ip, this.file);
                this.machine.logInstallFileBy(processMachine.ip, this.file);

                this.processSuccess = true;
                this.file.isInstalled = true;
                this.file.installedBy = user;

                this.file.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    self.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);
                        return callback();
                    })
                });
                break;
            case processTypes.FILE_RUN:
                if (!this.file)
                    return callback("File install failed: Couldn't find file to run");

                // processMachine.logInstallFileTo(this.machine.ip, installFile);
                // this.machine.logInstallFileBy(processMachine.ip, installFile);

                //todo: fail sometimes maybe
                this.processSuccess = true;
                switch (this.file.fileDef.type.toLowerCase()) {
                    case sharedHelpers.fileHelpers.types.HIDER:

                        break;
                    case sharedHelpers.fileHelpers.types.FINDER:

                        break;
                    case sharedHelpers.fileHelpers.types.ANTIVIRUS:
                        var removeArr = [],
                            i;
                        for (i = 0; i < this.machine.files.length; i++) {
                            if (this.machine.files[i].fileDef.isVirus &&
                                this.machine.files[i].fileDef.level <= this.file.fileDef.level &&
                                this.machine.files[i].isInstalled &&
                                this.machine.files[i].hidden <= this.machine.getFileStats().finder) {
                                removeArr.push(this.machine.files[i]);
                            }
                        }
                        for (i = 0; i < removeArr.length; i++) {
                            this.machine.files.pull(removeArr[i]);
                        }
                        break;
                }

                this.machine.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);
                    self.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);
                        return callback();
                    })
                });
                break;
            case processTypes.CRACK_PASSWORD_MACHINE:
                this.machine.determinePasswordCrackSuccess(processMachine, function (success) {
                    self.processSuccess = success;
                    var bot = new Bot({
                        user: user,
                        machine: self.machine
                    });
                    self.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", null);

                        if (success) {
                            bot.save(function (err, bot) {
                                if (err)
                                    console.log(err);
                                return callback();
                            });
                        }
                        else
                            callback();
                    });
                });
                break;
            default:
                callback();
        }
    }
};

module.exports = mongoose.model('process', processSchema);