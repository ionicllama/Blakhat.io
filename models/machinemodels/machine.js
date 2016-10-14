/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var Bot = require('../../models/machinemodels/bot');
var CPU = require('../../models/machinemodels/cpu');
var HDD = require('../../models/machinemodels/hdd');
var Internet = require('../../models/machinemodels/internet');
var Process = require('../../models/machinemodels/process');
var BankAccount = require('../../models/bankmodels/bankaccount');


var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var globalHelpers = require('../../helpers/globalHelpers');

var machineSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    bank: {type: mongoose.Schema.Types.ObjectId, ref: 'bank', default: null},
    log: {type: String, default: ""},
    lastLogUpdate: {type: Date, default: new Date()},
    ip: {type: String, default: ""},
    lastIPRefresh: {type: Date, default: null},
    password: {type: String, default: globalHelpers.getRandomPassword()},
    lastPasswordReset: {type: Date, default: null},
    cpu: {type: mongoose.Schema.Types.ObjectId, ref: 'cpu', default: null},
    hdd: {type: mongoose.Schema.Types.ObjectId, ref: 'hdd', default: null},
    internet: {type: mongoose.Schema.Types.ObjectId, ref: 'internet', default: null},
    files: [{
        name: {type: String, default: null},
        file: {type: mongoose.Schema.Types.ObjectId, ref: 'file', default: null},
        isLocked: {type: Boolean, default: false}
    }],
    processes: [{type: mongoose.Schema.Types.ObjectId, ref: 'process'}],
    usersCracked: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}]

});

machineSchema.statics = {
    findPopulated: function (query, callback) {
        var subPopulate = {
            path: 'processes',
            populate: [
                'file',
                {
                    path: 'machine',
                    select: '_id ip'
                },
                'bankAccount'
            ]
        };
        this.findOne(query).populate(['cpu', 'internet', 'hdd', 'files.file']).populate(subPopulate).exec(function (err, machine) {
            if (!machine || err)
                return callback(err, machine);

            return callback(null, machine);
        });
    },
    findByIdPopulated: function (_id, callback) {
        this.findPopulated({_id: _id}, function (err, machine) {
            callback(err, machine);
        });
    },
    findWithPassword: function (_id, callback) {
        this.findOne({_id: _id}).select('password').exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findForCrackedUser: function (_id, user, callback) {
        this.findOne({_id: _id, usersCracked: {_id: user._id}}).select('_id').exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findWithFiles: function (_id, callback) {
        this.findOne({_id: _id}).select('_id user password files').populate(['files.file']).exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findWithSingleFile: function (machine_id, file_id, callback) {
        this.findOne({_id: machine_id}).select('_id user password files').populate({
            path: 'files.file',
            match: {
                file: {
                    _id: file_id
                }
            }
        }).exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findByBank: function (bank_id, callback) {
        this.findOne({bank: bank_id}).select('ip user bank firewall log').populate('bank').exec(function (err, machine) {
            callback(null, machine);
        });
    },
    findByUserPopulated: function (user, callback) {
        var self = this,
            query = {user: {_id: user._id}};
        this.findPopulated(query, function (err, machine) {
            if (err)
                return callback(err);

            if (!machine) {
                machine = new self({user: user});
                machine.setDefaults(function () {
                    self.findPopulated(query, function (err, machine) {
                        callback(err, machine);
                    });
                });
            }
            else {
                return callback(null, machine);
            }
        });
    },
    findForInternet: function (search, user, callback) {
        if (!search || search.length == 0)
            return callback(null, {});

        var parseIp = sharedHelpers.parseIPFromString(search),
            query = {
                ip: search
            };

        if (parseIp && parseIp.length > 0)
            query.ip = parseIp;

        this.findOne(query).select('ip user bank firewall').populate('bank').exec(function (err, machine) {
            if (err)
                return callback(err);

            return callback(null, machine);
        });
    }
};

machineSchema.methods = {
    setDefaults: function (callback) {
        var self = this;
        this.setDefaultCPU(function (err) {
            if (err)
                console.log(err);
            self.setDefaultHDD(function (err) {
                if (err)
                    console.log(err);
                self.setDefaultInternet(function (err) {
                    if (err)
                        console.log(err);
                    self.ip = globalHelpers.getNewIP();
                    self.save(function (err) {
                        if (err)
                            console.log(err);
                        return callback();
                    });
                })
            });
        });
    },
    setDefaultCPU: function (callback) {
        if (!this.cpu) {
            var self = this;
            CPU.findOne({cores: 1, speed: 666}, function (err, newCPU) {
                if (err)
                    console.log(err);

                if (newCPU)
                    self.cpu = newCPU;

                callback();
            });
        }
    },
    setDefaultHDD: function (callback) {
        if (!this.hdd) {
            var self = this;
            HDD.findOne({size: 10}, function (err, newHDD) {
                if (err)
                    console.log(err);

                if (newHDD)
                    self.hdd = newHDD;

                callback();
            });
        }
    },
    setDefaultInternet: function (callback) {
        if (!this.internet) {
            var self = this;
            Internet.findOne({downSpeed: 5, upSpeed: 1}, function (err, newInternet) {
                if (err)
                    console.log(err);

                if (newInternet)
                    self.internet = newInternet;

                callback();
            });
        }
    },
    updateLog: function (log, isAppend, dateOverride, callback) {
        if (isAppend) {
            this.model('machine').findById(this._id, function (err, machine) {
                if (err && typeof callback == 'function')
                    return callback(err);

                machine.log = machine.log ? machine.log + '\n' + log : log;
                machine.lastLogUpdate = dateOverride ? dateOverride : new Date();
                machine.save(function (err) {
                    if (err && typeof callback == 'function')
                        return callback(err);

                    if (typeof callback == 'function')
                        callback();
                });
            })
        }
        else {
            this.log = log;
            this.lastLogUpdate = new Date();
            this.save(function (err) {
                if (err && typeof callback == 'function')
                    return callback(err);

                if (typeof callback == 'function')
                    callback();
            });
        }
    },
    appendLog: function (appendText) {
        //this is synchronous - no need to validate this was done before returning results
        if (appendText && appendText.length > 0) {
            this.updateLog(appendText, true, null, function (err) {
                if (err)
                    console.log(err);
            });
        }
    },
    logBankTransfer: function (sourceAccountNumber, destinationAccountNumber, destinationBankIP, amount) {
        var dateStr = (new Date()).toUTCString();
        this.appendLog("Transfer @ " + dateStr.substr(5, dateStr.length) + ": " + sharedHelpers.formatCurrency(amount) + " - " + sourceAccountNumber + " [" + this.ip + "] --> " + destinationAccountNumber + " [" + destinationBankIP + "]");
    },
    logBankAccountLogin: function (sourceIP, accountNumber) {
        var dateStr = (new Date()).toUTCString();
        this.appendLog("User logged in to account " + accountNumber + " from [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    },
    logAdminLogin: function (sourceIP) {
        var dateStr = (new Date()).toUTCString();
        this.appendLog("Admin logged in from [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    },
    logFileDownloadBy: function (sourceIP, file) {
        var dateStr = (new Date()).toUTCString(),
            fileName = file.file.name + '.' + file.file.type;
        if (file.name)
            fileName = file.name;
        this.appendLog(fileName + " downloaded by [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    },
    logFileDownloadFrom: function (sourceIP, file) {
        var dateStr = (new Date()).toUTCString(),
            fileName = file.file.name + '.' + file.file.type;
        if (file.name)
            fileName = file.name;
        this.appendLog(fileName + " downloaded from [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    },
    logFileUploadFrom: function (sourceIP, file) {
        var dateStr = (new Date()).toUTCString(),
            fileName = file.file.name + '.' + file.file.type;
        if (file.name)
            fileName = file.name;
        this.appendLog(fileName + " uploaded from [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    },
    logFileUploadTo: function (destinationIP, file) {
        var dateStr = (new Date()).toUTCString(),
            fileName = file.file.name + '.' + file.file.type;
        if (file.name)
            fileName = file.name;
        this.appendLog(fileName + " uploaded to [" + destinationIP + "] at " + dateStr.substr(5, dateStr.length));
    },
    getFirewallName: function () {
        return sharedHelpers.firewallHelpers.getFirewallName(this.firewall);
    },
    canRefreshIP: function () {
        return sharedHelpers.checkDateIsBeforeToday(sharedHelpers.getNewDateAddDays(this.lastIPRefresh, 1));
    },
    refreshIP: function (callback) {
        if (this.canRefreshIP()) {
            this.ip = globalHelpers.getNewIP();
            this.lastIPRefresh = new Date();
            this.usersCracked = [];
            Bot.find({machine: {id: this._id}}).remove().exec(function () {
                if (err)
                    return callback(null, err);

                this.save(function (err) {
                    if (err)
                        return callback(null, err);

                    callback();
                });
            });

        }
        else {
            callback("IP address has been already been reset in the last 24 hours");
        }
    },
    canResetPassword: function () {
        return sharedHelpers.checkDateIsBeforeToday(sharedHelpers.getNewDateAddHours(this.lastPasswordReset, 4));
    },
    resetPassword: function (callback) {
        if (this.canResetPassword()) {
            this.password = globalHelpers.getRandomPassword();
            this.lastPasswordReset = new Date();
            this.usersCracked = [];
            this.save(function (err) {
                if (err)
                    return callback(null, err);

                callback();
            });
        }
        else {
            callback("Password has been already been reset in the last 4 hours");
        }
    },
    upgradeCPU: function (user, paymentAccount, upgrade_id, callback) {
        if (this.cpu._id == upgrade_id)
            return callback("The selected upgrade different than existing hardware");

        var self = this;
        CPU.findOne({'_id': upgrade_id}, function (err, newCPU) {
            if (err || !newCPU)
                callback("Failed to purchase selected CPU", err);

            paymentAccount.makePurchase(user, newCPU.getCost(), function (err) {
                if (err)
                    return callback("Failed to purchase selected CPU", err);

                self.cpu = newCPU;
                self.save(function (err) {
                    if (err)
                        return callback("Failed to purchase selected CPU", err);

                    self.updateProcessCosts(function (err) {
                        if (err)
                            console.log(err);

                        callback();
                    });
                });
            });
        });
    },
    upgradeHDD: function (user, paymentAccount, upgrade_id, callback) {
        if (this.hdd._id == upgrade_id)
            return callback("The selected upgrade different than existing hardware");

        var self = this;
        HDD.findOne({'_id': upgrade_id}, function (err, newHDD) {
            if (err || !newHDD)
                callback("Failed to purchase selected hard drive", err);

            paymentAccount.makePurchase(user, newHDD.getCost(), function (err) {
                if (err)
                    return callback("Failed to purchase selected hard drive", err);

                self.hdd = newHDD;
                self.save(function (err) {
                    if (err) {
                        return callback("Failed to purchase selected hard drive", err);
                    }

                    callback();
                });
            });
        });
    },
    upgradeInternet: function (user, paymentAccount, upgrade_id, callback) {
        if (this.internet._id == upgrade_id)
            return callback("The selected upgrade different than existing hardware");

        var self = this;
        Internet.findOne({'_id': upgrade_id}, function (err, newInternet) {
            if (err || !newInternet)
                callback("Failed to purchase selected internet speed", err);

            paymentAccount.makePurchase(user, newInternet.getCost(), function (err) {
                if (err)
                    return callback("Failed to purchase selected internet speed", err);

                self.internet = newInternet;
                self.save(function (err) {
                    if (err) {
                        return callback("Failed to purchase selected internet speed", err);
                    }

                    self.updateProcessCosts(function (err) {
                        if (err)
                            console.log(err);

                        callback();
                    });
                });
            });
        });
    },
    validateAuth: function (user, password, callback) {
        if (user && this.user && user._id.toString() === this.user.toString())
            callback(true);
        else if (password && password.length > 0) {
            if (this.password)
                callback(password === this.password);
            else {
                this.model('machine').findWithPassword(this._id, function (err, machine) {
                    if (err) {
                        console.log(err);
                        callback(false);
                    }
                    else {
                        callback(password === machine.password);
                    }
                });
            }
        }
        else {
            this.model('bot').findUserBotByMachine(user._id, this._id, function (err, bot) {
                if (err) {
                    console.log(err);
                    callback(false);
                }
                else {
                    callback(bot != null && bot._id != null);
                }
            });
        }
    },
    updateProcessCosts: function (callback) {
        //process.cost == time in seconds the process will take to complete
        var self = this,
            processes = this.processes,
            cpuMod = this.cpu.getModifier(),
            localInternetSpeed = this.internet.getMegabyteSpeed(),
            cpuProcesses = 0,
            internetProcesses = 0,
            i;

        //probably refactor this to use underscore
        for (i = 0; i < processes.length; i++) {
            if (sharedHelpers.processHelpers.getProgress(processes[i]) >= 100)
                continue;

            switch (processes[i].type) {
                case Process.types.UPDATE_LOG:
                case Process.types.CRACK_PASSWORD_MACHINE:
                case Process.types.CRACK_PASSWORD_BANK:
                    cpuProcesses++;
                    break;
                case Process.types.FILE_DOWNLOAD:
                case Process.types.FILE_UPLOAD:
                    internetProcesses++;
                    break;
            }
        }

        //if there is more than one internet or cpu process, split the speeds amongst each process
        // before we loop back through and calculate
        if (cpuProcesses > 1)
            cpuMod = cpuMod / cpuProcesses;
        if (internetProcesses > 1) {
            localInternetSpeed.downSpeed = localInternetSpeed.downSpeed / internetProcesses;
            localInternetSpeed.upSpeed = localInternetSpeed.upSpeed / internetProcesses;
        }

        var cbCount = 0;

        var processPopulateOpts = [
            {
                path: 'machine',
                populate: {
                    path: 'internet',
                    select: 'upSpeed downSpeed'
                }
            },
            {
                path: 'file'
            }
        ];
        Process.populate(processes, processPopulateOpts, function (err) {
            if (err) {
                console.log(err);
                return callback();
            }

            if ((internetProcesses + cpuProcesses) > 0) {
                for (i = 0; i < processes.length; i++) {
                    var remoteInternetSpeed = processes[i].machine.internet.getMegabyteSpeed();

                    var progress = sharedHelpers.processHelpers.getProgress(processes[i]);
                    if (progress >= 100)
                        continue;

                    var seconds = 0;
                    switch (processes[i].type) {
                        case Process.types.UPDATE_LOG:
                            seconds = calculateUpdateLog(cpuMod);
                            break;
                        case Process.types.CRACK_PASSWORD_MACHINE:
                            seconds = calculateCrackMachinePassword(self, cpuMod, processes[i].machine);
                            break;
                        case Process.types.CRACK_PASSWORD_BANK:
                            break;
                        case Process.types.FILE_DOWNLOAD:
                            if (!processes[i].file) {
                                console.log("No file found to download");
                            }
                            seconds = calculateNetworkTransfer(processes[i].file, localInternetSpeed, remoteInternetSpeed, 'down');
                            break;
                        case Process.types.FILE_UPLOAD:
                            if (!processes[i].file) {
                                console.log("No file found to upload");
                            }
                            seconds = calculateNetworkTransfer(processes[i].file, localInternetSpeed, remoteInternetSpeed, 'up');
                            break;
                    }
                    //account for the progress that has already happeend
                    seconds = seconds - (progress / 100 * seconds);

                    processes[i].end = sharedHelpers.getNewDateAddSeconds(new Date(), seconds);
                    //currently doing this async, may want to change for performance and just deal with potential UI lag
                    processes[i].save(function (err) {
                        if (err)
                            console.log(err);

                        cbCount++;
                        if (cbCount === (internetProcesses + cpuProcesses))
                            callback();
                    });
                }
            }
            else {
                callback();
            }
        });
    }
};

function calculateUpdateLog(cpuMod) {
    var s = Process.basicCosts.UPDATE_LOG;
    return Math.ceil(s * (s / (cpuMod / 2)));
}

function calculateCrackMachinePassword(processMachine, cpuMod, crackMachine) {
    console.log(processMachine);
    console.log(crackMachine);
    return 30;
}

function calculateNetworkTransfer(file, localInternetSpeed, remoteInternetSpeed, direction) {
    if (direction === 'down') {
        var maxDownloadSpeed = Math.min(localInternetSpeed.downSpeed, remoteInternetSpeed.upSpeed);
        return Math.ceil(file.size / maxDownloadSpeed);
    }
    else {
        var maxUploadSpeed = Math.min(localInternetSpeed.upSpeed, remoteInternetSpeed.downSpeed);
        return Math.ceil(file.size / maxUploadSpeed);
    }

}

module.exports = mongoose.model('machine', machineSchema);