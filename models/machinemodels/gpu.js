/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var gpuSchema = mongoose.Schema({

    cores: {type: Number},
    speed: {type: Number}

});

gpuSchema.methods = {
    getName: function () {
        return sharedHelpers.gpuHelpers.getGPUName(this);
    },
    getCost: function () {
        return sharedHelpers.gpuHelpers.getGPUCost(this);
    },
    getModifier: function () {
        return sharedHelpers.gpuHelpers.getGPUModifier(this);
    }
};

module.exports = mongoose.model('gpu', gpuSchema);