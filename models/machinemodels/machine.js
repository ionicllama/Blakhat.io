/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var User = require('../../models/user');
var Bank = require('../../models/bankmodels/bank');
var CPU = require('../../models/machinemodels/cpu');
var HDD = require('../../models/machinemodels/hdd');
var Internet = require('../../models/machinemodels/internet');


var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var globalHelpers = require('../../helpers/globalHelpers');

var machineSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    bank: {type: mongoose.Schema.Types.ObjectId, ref: 'bank'},
    log: {type: String, default: ""},
    lastLogUpdate: {type: String, default: new Date()},
    ip: {type: String, default: globalHelpers.getNewIp()},
    lastIPRefresh: {type: Date, default: null},
    password: {type: String, default: globalHelpers.getRandomPassword()},
    lastPasswordReset: {type: Date, default: null},
    cpu: {type: mongoose.Schema.Types.ObjectId, ref: 'cpu', default: null},
    hdd: {type: mongoose.Schema.Types.ObjectId, ref: 'hdd', default: null},
    firewall: {type: mongoose.Schema.Types.ObjectId, ref: 'firewall', default: null},
    internet: {type: mongoose.Schema.Types.ObjectId, ref: 'internet', default: null}

});

machineSchema.statics = {
    findPopulated: function (query, callback) {
        this.findOne(query).populate(['cpu', 'internet', 'hdd']).exec(function (err, machine) {
            callback(err, machine);
        });
    },
    findByIdPopulated: function (_id, callback) {
        this.findOne({_id: _id}).populate(['cpu', 'internet', 'hdd']).exec(function (err, machine) {
            callback(err, machine);
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
                machine.setDefaultRefs(function () {
                    self.findPopulated(query, function (err, machine) {
                        callback(err, machine);
                    });
                });
            }
            else {
                callback(null, machine);
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

            if (machine && machine.bank) {
                //this is a bank machine ip
                machine.populate("bank", function (err, machine) {
                    if (err)
                        return callback(err);

                    callback(err, machine);
                });
            }
            else {
                callback(null, machine);
            }
        });
    }
};

machineSchema.methods = {
    setDefaultRefs: function (callback) {
        var self = this;
        this.setDefaultCPU(function () {
            self.setDefaultHDD(function () {
                self.setDefaultInternet(function () {
                    callback();
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

                if (newCPU) {
                    self.cpu = newCPU;
                    self.save(function (err) {
                        if (err)
                            console.log(err);

                        callback();
                    });
                }
            });
        }
    },
    setDefaultHDD: function (callback) {
        if (!this.hdd) {
            var self = this;
            HDD.findOne({size: 20}, function (err, newHDD) {
                if (err)
                    console.log(err);

                if (newHDD) {
                    self.hdd = newHDD;
                    self.save(function (err) {
                        if (err)
                            console.log(err);

                        callback();
                    });
                }
            });
        }
    },
    setDefaultInternet: function (callback) {
        if (!this.internet) {
            var self = this;
            Internet.findOne({downSpeed: 5, upSpeed: 1}, function (err, newInternet) {
                if (err)
                    console.log(err);

                if (newInternet) {
                    self.internet = newInternet;
                    self.save(function (err) {
                        if (err)
                            console.log(err);

                        callback();
                    });
                }
            });
        }
    },
    updateLog: function (log, callback) {
        this.log = log;
        this.lastLogUpdate = new Date();
        this.save(function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback();
        });
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
            this.ip = globalHelpers.getNewIp();
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
            callback("IP address has been already been reset in the last 24 hours.");
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
            callback("Password has been already been reset in the last 4 hours.");
        }
    },
    upgradeCPU: function (user, upgrade_id, callback) {
        if (this.cpu._id != upgrade_id) {
            var self = this;
            CPU.findOne({'_id': upgrade_id}, function (err, newCPU) {
                if (err) {
                    callback(null, err);
                    return;
                }

                if (newCPU) {
                    self.cpu = newCPU;
                    var purchaseCallback = function (err) {
                        if (err) {
                            callback(null, err);
                            return;
                        }

                        self.save(function (err) {
                            if (err) {
                                callback(null, err);
                                return;
                            }

                            callback();
                        });
                    };
                    purchasingHelpers.processPurchase(user, newCPU.getCost(), purchaseCallback);

                }
                else {
                    callback(null, err);
                }
            });
        }
        else {
            callback("The selected upgrade different than existing hardware.");
        }
    },
    upgradeHDD: function (user, upgrade_id, callback) {
        if (this.hdd._id != upgrade_id) {
            var self = this;
            HDD.findOne({'_id': upgrade_id}, function (err, newHDD) {
                if (err) {
                    callback(null, err);
                    return;
                }
                var purchaseCallback = function (err) {
                    if (err) {
                        callback(null, err);
                        return;
                    }

                    self.hdd = newHDD;
                    self.save(function (err) {
                        if (err) {
                            callback(null, err);
                            return;
                        }
                        callback();
                    });
                };
                purchasingHelpers.processPurchase(user, newHDD.getCost(), purchaseCallback);
            });
        }
        else {
            callback("The selected upgrade different than existing hardware.");
        }
    },
    upgradeInternet: function (user, upgrade_id, callback) {
        if (this.internet._id != upgrade_id) {
            var self = this;
            Internet.findOne({'_id': upgrade_id}, function (err, newInternet) {
                if (err) {
                    callback(null, err);
                    return;
                }
                var purchaseCallback = function (err) {
                    if (err) {
                        callback(null, err);
                        return;
                    }

                    self.internet = newInternet;
                    self.save(function (err) {
                        if (err) {
                            callback(null, err);
                            return;
                        }
                        callback();
                    });
                };
                purchasingHelpers.processPurchase(user, newInternet.getCost(), purchaseCallback);
            });
        }
        else {
            callback("The selected upgrade different than existing hardware.");
        }
    },
    calculateCPUUpgradeCost: function (cores, speed) {
        return sharedHelpers.cpuHelpers.calculateCPUCost(cores, speed);
    },
    validateAuth: function (user, password) {
        return ((user && user._id.toString() == user._id.toString()) || this.password == password);
    },
    appendLog: function (appendText) {
        //this is synchronous - no need to validate this was done before returning results
        if (appendText && appendText.length > 0) {
            var newLog = (this.log ? this.log : "") + '\n' + appendText;
            this.updateLog(newLog, function (err) {
                if (err)
                    console.log(err);
            });
        }
    },
    logAccess: function (sourceIP) {
        var dateStr = (new Date()).toUTCString();
        this.appendLog("Admin logged in from [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    }
};

// create the model for users and expose it to our app
module.exports = mongoose.model('machine', machineSchema);