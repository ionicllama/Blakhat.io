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
    password: {type: String, default: getRandomPassword()},
    ip: {type: String, default: getNewIp()},
    lastIPRefresh: {type: Date, default: null},
    cpu: {type: mongoose.Schema.Types.ObjectId, ref: 'cpu', default: null},
    hdd: {type: mongoose.Schema.Types.ObjectId, ref: 'hdd', default: null},
    internet: {type: mongoose.Schema.Types.ObjectId, ref: 'internet', default: null},
    firewall: {type: mongoose.Schema.Types.ObjectId, ref: 'firewall', default: null},

});

machineSchema.methods = {
    // getDefaultCPU: function(){
    //     CPU.findOne({cores: 1, speed: 666}, function (err, newCPU) {
    //         if (err)
    //             throw err;
    //
    //         if (newCPU) {
    //             return newCPU;
    //         }
    //     });
    // },
    setDefaultRefs: function () {
        var self = this;
        if (!this.cpu) {
            CPU.findOne({cores: 1, speed: 666}, function (err, newCPU) {
                if (err)
                    throw err;

                if (newCPU) {
                    self.cpu = newCPU;
                    self.save(function (err) {
                        if (err)
                            throw err;
                    });
                }
            });
        }

        if (!this.internet) {
            Internet.findOne({downSpeed: 5, upSpeed: 1}, function (err, newInternet) {
                if (err)
                    throw err;

                if (newInternet) {
                    self.internet = newInternet;
                    self.save(function (err) {
                        if (err)
                            throw err;
                    });
                }
            });
        }

        if (!this.hdd) {
            HDD.findOne({size: 20}, function (err, newHDD) {
                if (err)
                    throw err;

                if (newHDD) {
                    self.hdd = newHDD;
                    self.save(function (err) {
                        if (err)
                            throw err;
                    });
                }
            });
        }
    },
    getFirewallName: function () {
        return sharedHelpers.firewallHelpers.getFirewallName(this.firewall);
    },
    getNextIPRefreshDateString: function () {
        return sharedHelpers.getDateDiffString(this.lastIPRefresh);
    },
    canRefreshIP: function () {
        return sharedHelpers.checkDateIsBeforeToday(sharedHelpers.getNewDateAddDays(this.lastIPRefresh, 1));
    },
    refreshIP: function (callback) {
        if (this.canRefreshIP()) {
            this.ip = getNewIp();
            this.lastIPRefresh = new Date();
            this.save(function (err) {
                if (err) {
                    console.log(err);
                    callback("Failed to refresh IP address");
                    return;
                }
                callback();
            });
            return true;
        }
        else {
            callback("IP address has been already been reset in the last 24 hours.");
            return false;
        }
    },
    upgradeCPU: function (user, upgrade_id, callback) {
        var failureResponse = "Failed to upgrade CPU";
        if (this.cpu._id != upgrade_id) {
            var self = this;
            CPU.findOne({'_id': upgrade_id}, function (err, newCPU) {
                if (err) {
                    callback(failureResponse);
                    console.log(err);
                    return;
                }

                if (newCPU) {
                    self.cpu = newCPU;
                    var purchaseCallback = function (err) {
                        if (err) {
                            callback(failureResponse);
                            console.log(err);
                            return;
                        }

                        self.save(function (err) {
                            if (err) {
                                callback(failureResponse);
                                console.log(err);
                                return;
                            }

                            callback();
                        });
                    };
                    purchasingHelpers.processPurchase(user, newCPU.getCost(), purchaseCallback);

                }
                else {
                    callback(failureResponse);
                    console.log(err);
                }
            });
        }
        else {
            errorHelpers.returnError("The selected CPU is not an upgrade your existing hardware.", res);
        }
    },
    upgradeHDD: function (user, upgrade_id, callback) {
        if (this.hdd._id != upgrade_id) {
            var self = this;
            HDD.findOne({'_id': upgrade_id}, function (err, newHDD) {
                if (err) {
                    console.log(err);
                    callback("Failed to upgrade HDD");
                    return;
                }
                var purchaseCallback = function (err) {
                    if (err) {
                        console.log(err);
                        callback("Failed to upgrade HDD");
                        return;
                    }

                    self.hdd = newHDD;
                    self.save(function (err) {
                        if (err) {
                            console.log(err);
                            callback(err);
                            return;
                        }
                        callback();
                    });
                };
                purchasingHelpers.processPurchase(user, newHDD.getCost(), purchaseCallback);
            });
        }
        else {
            callback("The selected HDD is not an upgrade to your existing hardware.");
        }
    },
    upgradeInternet: function (user, upgrade_id, callback) {
        if (this.internet._id != upgrade_id) {
            var self = this;
            Internet.findOne({'_id': upgrade_id}, function (err, newInternet) {
                if (err) {
                    console.log(err);
                    callback("Failed to upgrade internet");
                    return;
                }
                var purchaseCallback = function (err) {
                    if (err) {
                        console.log(err);
                        callback("Failed to upgrade internet");
                        return;
                    }

                    self.internet = newInternet;
                    self.save(function (err) {
                        if (err) {
                            console.log(err);
                            callback(err);
                            return;
                        }
                        callback();
                    });
                };
                purchasingHelpers.processPurchase(user, newInternet.getCost(), purchaseCallback);
            });
        }
        else {
            callback("The selected HDD is not an upgrade to your existing hardware.");
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