/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var Machine = require('../../models/machinemodels/machine');
var Bot = require('../../models/machinemodels/bot');

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
    success: {type: Boolean, default: null},
    failureReason: {type: String, default: null}

});

processSchema.statics = {
    types: {
        CRACK_PASSWORD_MACHINE: sharedHelpers.processHelpers.types.CRACK_PASSWORD_MACHINE,
        CRACK_PASSWORD_BANK: sharedHelpers.processHelpers.types.CRACK_PASSWORD_BANK,
        FILE_DOWNLOAD: sharedHelpers.processHelpers.types.FILE_DOWNLOAD,
        FILE_UPLOAD: sharedHelpers.processHelpers.types.FILE_UPLOAD,
        UPDATE_LOG: sharedHelpers.processHelpers.types.UPDATE_LOG
    },
    basicCosts: {
        UPDATE_LOG: 180
    },
    findByMachine: function (_id, callback) {
        this.find({processMachine: {_id: _id}}).populate(['machine', 'bankAccount']).exec(function (err, processes) {
            if (err)
                return callback(err);

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
                    this.success = false;
                    this.failureReason = "Another user updated the log before you"
                    this.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", null);

                        return callback();
                    });
                }
                else {
                    //todo: maybe fail sometimes randomly
                    this.success = true;
                    this.machine.updateLog(this.log ? this.log : "", false, startDate, function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", null);

                        self.save(function (err) {
                            if (err)
                                return callback("Failed to execute the selected process", null);

                            return callback();
                        });
                    })
                }
                break;
            case processTypes.FILE_DOWNLOAD:
                //todo: maybe fail sometimes randomly
                this.success = true;
                var downloadFile = {
                    name: null,
                    file: this.file,
                    isLocked: false
                };
                processMachine.files.push(downloadFile);

                processMachine.logFileDownloadFrom(this.machine.ip, downloadFile);
                this.machine.logFileDownloadBy(processMachine.ip, downloadFile);

                processMachine.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", null);

                    self.save(function (err) {
                        if (err)
                            return callback("Failed to execute the selected process", null);

                        return callback();
                    })
                });
                break;
            case processTypes.FILE_UPLOAD:
                //todo: maybe fail sometimes randomly
                this.success = true;
                var uploadFile = {
                    _id: mongoose.Types.ObjectId(),
                    name: null,
                    file: this.file,
                    isLocked: false
                };

                processMachine.logFileUploadTo(this.machine.ip, uploadFile);
                this.machine.logFileUploadFrom(processMachine.ip, uploadFile);

                this.model('machine').findByIdAndUpdate(
                    this.machine._id,
                    {$push: {"files": uploadFile}},
                    {safe: true, upsert: true},
                    function (err, model) {
                        if (err)
                            return callback("Failed to execute the selected process", null);

                        self.save(function (err) {
                            if (err)
                                return callback("Failed to execute the selected process", null);

                            return callback();
                        })
                    }
                );
                break;
            case processTypes.CRACK_PASSWORD_MACHINE:
                //todo: maybe fail sometimes randomly
                this.success = true;
                var bot = new Bot({
                    user: user,
                    machine: this.machine
                });
                this.save(function (err) {
                    if (err)
                        return callback("Failed to execute the selected process", null);

                    bot.save(function (err, bot) {
                        return callback();
                    });
                });
                break;
            default:
                callback();
        }
    }
};

module.exports = mongoose.model('process', processSchema);