/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var cpuSchema = mongoose.Schema({

    cores: {type: Number},
    speed: {type: Number}

});

cpuSchema.methods = {
    getName: function () {
        return sharedHelpers.cpuHelpers.getCPUName(this);
    },
    getCost: function () {
        return sharedHelpers.cpuHelpers.getCPUCost(this);
    },
    getModifier: function () {
        return sharedHelpers.cpuHelpers.getCPUModifier(this);
    }
};

module.exports = mongoose.model('cpu', cpuSchema);