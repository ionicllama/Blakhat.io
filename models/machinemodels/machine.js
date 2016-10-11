/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var CPU = require('../../models/machinemodels/cpu');
var HDD = require('../../models/machinemodels/hdd');
var Internet = require('../../models/machinemodels/internet');
var Process = require('../../models/machinemodels/process');


var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var globalHelpers = require('../../helpers/globalHelpers');

var machineSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    bank: {type: mongoose.Schema.Types.ObjectId, ref: 'bank', default: null},
    log: {type: String, default: ""},
    lastLogUpdate: {type: String, default: new Date()},
    ip: {type: String, default: ""},
    lastIPRefresh: {type: Date, default: null},
    password: {type: String, default: globalHelpers.getRandomPassword()},
    lastPasswordReset: {type: Date, default: null},
    cpu: {type: mongoose.Schema.Types.ObjectId, ref: 'cpu', default: null},
    hdd: {type: mongoose.Schema.Types.ObjectId, ref: 'hdd', default: null},
    internet: {type: mongoose.Schema.Types.ObjectId, ref: 'internet', default: null},
    files: [{
        name: {type: String, default: "no_name.txt"},
        file: {type: mongoose.Schema.Types.ObjectId, ref: 'file', default: null},
        isLocked: {type: Boolean, default: false}
    }],
    processes: [{type: mongoose.Schema.Types.ObjectId, ref: 'process'}]

});

machineSchema.statics = {
    findPopulated: function (query, callback) {
        this.findOne(query).populate(['cpu', 'internet', 'hdd', 'files.file', 'processes']).exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findByIdPopulated: function (_id, callback) {
        this.findOne({_id: _id}).populate(['cpu', 'internet', 'hdd', 'files.file', 'processes']).exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findWithPassword: function (_id, callback) {
        this.findOne({_id: _id}).select('password').exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findWithFiles: function (_id, callback) {
        this.findOne({_id: _id}).populate(['files.file']).exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findWithSingleFile: function (machine_id, file_id, callback) {
        this.findOne({_id: machine_id}).populate({
            path: 'files.file',
            match: {_id: file_id}
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
            HDD.findOne({size: 20}, function (err, newHDD) {
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
    updateLog: function (log, isAppend, callback) {
        if (isAppend) {
            this.model('machine').findById(this._id, function (err, machine) {
                if (err && typeof callback == 'function')
                    return callback(err);

                machine.log = machine.log ? machine.log + '\n' + log : log;
                machine.lastLogUpdate = new Date();
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
            this.updateLog(appendText, true, function (err) {
                if (err)
                    console.log(err);
            });
        }
    },
    logBankTransfer: function (sourceAccountNumber, destinationAccountNumber, destinationBankIP, amount) {
        var dateStr = (new Date()).toUTCString();
        this.appendLog("Transfer @ " + dateStr.substr(5, dateStr.length) + ": " + sharedHelpers.formatCurrency(amount) + " - " + sourceAccountNumber + " [" + this.ip + "] --> " + destinationAccountNumber + " [" + destinationBankIP + "]");
    },
    logAccess: function (sourceIP) {
        var dateStr = (new Date()).toUTCString();
        this.appendLog("Admin logged in from [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    },
    getFirewallName: function () {
        return sharedHelpers.firewallHelpers.getFirewallName(this.firewall);
    },
    canRefreshIP: function () {
        return sharedHelpers.checkDateIsBeforeToday(sharedHelpers.getNewDateAddDays(this.lastIPRefresh, 1));
    },
    canResetPassword: function () {
        return sharedHelpers.checkDateIsBeforeToday(sharedHelpers.getNewDateAddHours(this.lastPasswordReset, 4));
    },
    refreshIP: function (callback) {
        if (this.canRefreshIP()) {
            this.ip = globalHelpers.getNewIP();
            this.lastIPRefresh = new Date();
            this.save(function (err) {
                if (err) {
                    callback(null, err);
                    return;
                }
                callback();
            });
        }
        else {
            callback("IP address has been already been reset in the last 24 hours");
        }
    },
    resetPassword: function (callback) {
        if (this.canResetPassword()) {
            this.password = globalHelpers.getRandomPassword();
            this.lastPasswordReset = new Date();
            this.save(function (err) {
                if (err) {
                    callback(null, err);
                    return;
                }
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
                    if (err) {
                        return callback("Failed to purchase selected CPU", err);
                    }

                    callback();
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

                    callback();
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
            callback(false);
        }
    }
};

// create the model for users and expose it to our app
module.exports = mongoose.model('machine', machineSchema);