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
var purchasingHelpers = require('../../helpers/purchasingHelpers');

var machineSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    bank: {type: mongoose.Schema.Types.ObjectId, ref: 'bank'},
    log: {type: String, default: ""},
    lastLogUpdate: {type: String, default: new Date()},
    ip: {type: String, default: getNewIp()},
    lastIPRefresh: {type: Date, default: null},
    password: {type: String, default: getRandomPassword()},
    lastPasswordReset: {type: Date, default: null},
    cpu: {type: mongoose.Schema.Types.ObjectId, ref: 'cpu', default: null},
    hdd: {type: mongoose.Schema.Types.ObjectId, ref: 'hdd', default: null},
    firewall: {type: mongoose.Schema.Types.ObjectId, ref: 'firewall', default: null},
    internet: {type: mongoose.Schema.Types.ObjectId, ref: 'internet', default: null}

});

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
            this.ip = getNewIp();
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
            this.password = getRandomPassword();
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
    }
};

/* MODEL LOCAL METHODS */
function getNewIp() {
    return sharedHelpers.randomNumber_255(2) +
        "." +
        sharedHelpers.randomNumber_255() +
        "." +
        sharedHelpers.randomNumber_255() +
        "." +
        sharedHelpers.randomNumber_255();
}

function getRandomPassword() {
    //todo: generates a random 10 character alphanumeric password
    return Math.random().toString(32).slice(2).substr(0, 10);
}

// create the model for users and expose it to our app
module.exports = mongoose.model('Machine', machineSchema);