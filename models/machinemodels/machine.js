/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var globalHelpers = require('../../helpers/globalHelpers');
var mongoose = require('mongoose');

var _ = require('underscore');

var CPU = require('../../models/machinemodels/cpu');

/* MODEL CONSTANTS */
const NETWORKS = {
        LEVEL_0: {
            up: 1,
            down: 5
        },
        LEVEL_1: {
            up: 5,
            down: 15
        },
        LEVEL_2: {
            up: 10,
            down: 25
        },
        LEVEL_3: {
            up: 20,
            down: 50
        },
        LEVEL_4: {
            up: 50,
            down: 90
        },
        LEVEL_5: {
            up: 100,
            down: 150
        },
        LEVEL_6: {
            up: 300,
            down: 500
        },
        LEVEL_7: {
            up: 500,
            down: 800
        },
        LEVEL_8: {
            up: 750,
            down: 1000
        },
        LEVEL_9: {
            up: 1000,
            down: 1000
        }
    },
    HDDS = {
        HDD_0: {
            size: 20
        },
        HDD_1: {
            size: 80
        },
        HDD_2: {
            size: 160
        },
        HDD_3: {
            size: 320
        },
        HDD_4: {
            size: 500
        },
        HDD_5: {
            size: 1000
        }
    },
    FIREWALLS = {
        FIREWALL_0: {
            level: 0,
            name: "None"
        },
        FIREWALL_1: {
            level: 1,
            name: "Level 1"
        },
        FIREWALL_2: {
            level: 2,
            name: "Level 2"
        },
        FIREWALL_3: {
            level: 3,
            name: "Level 3"
        },
        FIREWALL_4: {
            level: 4,
            name: "Level 4"
        },
        FIREWALL_5: {
            level: 5,
            name: "Level 5"
        }
    };

/* MODEL METHODS */
function getNewIp() {
    return globalHelpers.randomNumber() +
        "." +
        globalHelpers.randomNumber() +
        "." +
        globalHelpers.randomNumber() +
        "." +
        globalHelpers.randomNumber();
}

var machineSchema = mongoose.Schema({

    user_id: mongoose.Schema.Types.ObjectId,
    nodeType: {type: Number, default: 0},
    ip: {type: String, default: getNewIp()},
    lastIPRefresh: {type: Date, default: new Date()},
    internet: {
        speed: {
            up: {type: Number, default: NETWORKS.LEVEL_0.up},
            down: {type: Number, default: NETWORKS.LEVEL_0.down}
        }
    },
    cpu: {type: mongoose.Schema.Types.ObjectId, ref: 'cpu'},
    hdd: {
        size: {type: Number, default: HDDS.HDD_0.size}
    },
    firewall: {
        level: {type: Number, default: FIREWALLS.FIREWALL_0.level}
    }

});

machineSchema.methods = {
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

                        return true
                    });
                }
                else {
                    return false;
                }
            });
        }
    },
    getFirewallName: function () {
        for (var i in FIREWALLS) {
            if (this.firewall.level === FIREWALLS[i].level)
                return FIREWALLS[i].name;
        }
        return FIREWALLS.FIREWALL_0.name;
    },
    getNextIPRefreshDateString: function () {
        var date = new Date(),
            totalMinutes = globalHelpers.getDateMinutesDiff(this.lastIPRefresh, date),
            hours = Math.floor(totalMinutes / 60),
            minutes = totalMinutes % 60;
        return (hours + 'hrs ' + minutes + 'min');
    },
    canRefreshIP: function () {
        var refreshAvailDate = globalHelpers.getNewDateAddDays(this.lastIPRefresh, 1);
        return !this.lastIPRefresh || (refreshAvailDate < new Date());
    },
    refreshIP: function () {
        if (this.canRefreshIP()) {
            this.ip = getNewIp();
            return true;
        }
        else {
            return false;
        }
    },
    calculateCPUCost: function () {
        return sharedHelpers.machineHelpers.calculateCPUCost(this.cpu.cores, this.cpu.speed);
    },
    calculateNewCPUCost: function (cores, speed) {
        return sharedHelpers.machineHelpers.calculateCPUCost(cores, speed);
    }
};

machineSchema.statics.NETWORKS = NETWORKS;
machineSchema.statics.HDDS = HDDS;
machineSchema.statics.FIREWALLS = FIREWALLS;

// create the model for users and expose it to our app
module.exports = mongoose.model('Machine', machineSchema);