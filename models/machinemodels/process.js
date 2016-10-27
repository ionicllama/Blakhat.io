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
    isPaused: {type: Boolean, default: false},
    pausedOn: {type: Date, default: null},
    processSuccess: {type: Boolean, default: null},
    failureReason: {type: String, default: null}

});

processSchema.statics = {
    types: {
        UPDATE_LOG: sharedHelpers.processHelpers.types.UPDATE_LOG,
        CRACK_PASSWORD_MACHINE: sharedHelpers.processHelpers.types.CRACK_PASSWORD_MACHINE,
        CRACK_PASSWORD_BANK: sharedHelpers.processHelpers.types.CRACK_PASSWORD_BANK,
        FILE_DOWNLOAD: sharedHelpers.processHelpers.types.FILE_DOWNLOAD,
        FILE_UPLOAD: sharedHelpers.processHelpers.types.FILE_UPLOAD,
        FILE_INSTALL: sharedHelpers.processHelpers.types.FILE_INSTALL,
        FILE_COPY_EXTERNAL: sharedHelpers.processHelpers.types.FILE_COPY_EXTERNAL,
        FILE_MOVE_EXTERNAL: sharedHelpers.processHelpers.types.FILE_MOVE_EXTERNAL,
        FILE_COPY_INTERNAL: sharedHelpers.processHelpers.types.FILE_COPY_INTERNAL,
        FILE_MOVE_INTERNAL: sharedHelpers.processHelpers.types.FILE_MOVE_INTERNAL,
        FILE_RUN: sharedHelpers.processHelpers.types.FILE_RUN,
        FILE_DELETE: sharedHelpers.processHelpers.types.FILE_DELETE
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
            return callback("Failed to execute the selected process, its not complete yet.");

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
            case processTypes.FILE_DOWNLOAD:
                if (!this.file)
                    return callback("Couldn't find file to download");

                var usedDownloadSpace = sharedHelpers.fileHelpers.getFilesSizeTotal(processMachine.files);
                if (this.file.fileDef.size > (processMachine.hdd.size - usedDownloadSpace))
                    return callback("Not enough space on your hard drive to download this file.");

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
                    return callback("Not enough space on destination machine's hard drive to upload this file.");

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

                //todo: maybe fail sometimes randomly
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
            case processTypes.FILE_COPY_EXTERNAL:
                if (!this.file)
                    return callback("File copy failed: Couldn't find file to copy");

                var usedCopySpaceEx = sharedHelpers.fileHelpers.getFilesSizeTotal(processMachine.externalFiles);
                if (this.file.fileDef.size > (processMachine.externalHDD.size - usedCopySpaceEx))
                    return callback("Not enough space on this machine's external hard drive to copy this file.");

                //todo: maybe fail sometimes randomly
                this.processSuccess = true;
                var copyFileEx = new File({
                    name: null,
                    fileDef: this.file.fileDef,
                    isLocked: false
                });

                processMachine.logFileCopyExternal(copyFileEx);

                copyFileEx.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    processMachine.externalFiles.push(copyFileEx);
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
            case processTypes.FILE_MOVE_EXTERNAL:
                if (!this.file)
                    return callback("File copy failed: Couldn't find file to move");

                var usedMoveSpaceEx = sharedHelpers.fileHelpers.getFilesSizeTotal(processMachine.externalFiles);
                if (this.file.fileDef.size > (processMachine.externalHDD.size - usedMoveSpaceEx))
                    return callback("Not enough space on this machine's external hard drive to move this file.");

                //todo: maybe fail sometimes randomly
                this.processSuccess = true;

                processMachine.logFileMoveExternal(this.file);

                processMachine.files.pull(this.file);
                processMachine.externalFiles.push(this.file);
                processMachine.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    self.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);

                        return callback();
                    })
                });
                break;
            case processTypes.FILE_COPY_INTERNAL:
                if (!this.file)
                    return callback("File copy failed: Couldn't find file to copy");

                var usedCopySpaceIn = sharedHelpers.fileHelpers.getFilesSizeTotal(processMachine.files);
                if (this.file.fileDef.size > (processMachine.hdd.size - usedCopySpaceIn))
                    return callback("Not enough space on this machine's hard drive to copy this file.");

                //todo: maybe fail sometimes randomly
                this.processSuccess = true;
                var copyFileIn = new File({
                    name: null,
                    fileDef: this.file.fileDef,
                    isLocked: false
                });

                processMachine.logFileCopyInternal(copyFileIn);

                copyFileIn.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    processMachine.files.push(copyFileIn);
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
            case processTypes.FILE_MOVE_INTERNAL:
                if (!this.file)
                    return callback("File copy failed: Couldn't find file to move");

                var usedMoveSpaceIn = sharedHelpers.fileHelpers.getFilesSizeTotal(processMachine.files);
                if (this.file.fileDef.size > (processMachine.hdd.size - usedMoveSpaceIn))
                    return callback("Not enough space on this machine's hard drive to move this file.");

                //todo: maybe fail sometimes randomly
                this.processSuccess = true;

                processMachine.logFileMoveInternal(this.file);

                processMachine.externalFiles.pull(this.file);
                processMachine.files.push(this.file);
                processMachine.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    self.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", err);

                        return callback();
                    })
                });
                break;
            case processTypes.FILE_DELETE:
                if (!this.file)
                    return callback("File copy failed: Couldn't find file to delete");

                //todo: maybe fail sometimes randomly
                this.processSuccess = true;

                processMachine.logFileDelete(this.file);

                //pull from both external and internal files, files are unique so it will only be in one or the other
                processMachine.externalFiles.pull(this.file);
                processMachine.files.pull(this.file);
                processMachine.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", err);

                    self.file.remove(function (err) {
                        if (err)
                            console.log("Failed to delete file model after removing fom machine files array.", err);

                        self.save(function (err) {
                            if (err)
                                return callback("Failed to execute the selected process", err);

                            return callback();
                        })
                    });
                });
                break;
            default:
                callback();
        }
    }
};

module.exports = mongoose.model('process', processSchema);