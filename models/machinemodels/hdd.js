/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var hddScheme = mongoose.Schema({

    size: {type: Number}

});

hddScheme.methods = {
    getName: function () {
        return sharedHelpers.hddHelpers.getHDDName(this);
    },
    getCost: function () {
        return sharedHelpers.hddHelpers.getHDDCost(this);
    },
    getModifier: function () {
        return sharedHelpers.hddHelpers.getModifier(this);
    }
};

module.exports = mongoose.model('hdd', hddScheme);