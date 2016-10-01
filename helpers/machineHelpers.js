/**
 * Created by Evan on 9/27/2016.
 */
var Machine = require('../models/machinemodels/machine');

var machineHelpers = {

    validateMachinePassword: function (user, password, sourceIP, machine) {
        return (machine.user.toString() == user._id.toString() || machine.password == password);
    },
    getUserMachine: function (user, callback) {
        var self = this,
            query = {user: {_id: user._id}};
        this.getMachine(query, function (machine) {
            if (!machine) {
                machine = new Machine({user: user});
                machine.setDefaultRefs(function () {
                    self.getMachine(query, function (machine) {
                        callback(machine);
                    });
                });
            }
            else {
                callback(machine);
            }
        });
    },
    getMachine: function (query, callback) {
        Machine.findOne(query).populate(['cpu', 'internet', 'hdd']).exec(function (err, machine) {
            if (err)
                console.log(err);

            callback(machine);
        });
    },
    appendMachineLog: function (machine, appendText) {
        //this is synchronous - no need to validate this was done before returning results
        var newLog = (machine.log ? machine.log : "") + '\n' + appendText;
        machine.updateLog(newLog, function (err) {
            if (err)
                console.log(err);
        });
    },
    logMachineAccess: function (machine, sourceIP) {
        var dateStr = (new Date()).toUTCString();
        this.appendMachineLog(machine, "Admin logged in from [" + sourceIP + "] at " + dateStr.substr(5, dateStr.length));
    }
};

module.exports = machineHelpers;