/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var externalHDDScheme = mongoose.Schema({

    size: {type: Number}

});

externalHDDScheme.methods = {
    getName: function () {
        return sharedHelpers.externalHDDHelpers.getExternalHDDName(this);
    },
    getCost: function () {
        return sharedHelpers.externalHDDHelpers.getExternalHDDCost(this);
    }
};

module.exports = mongoose.model('externalhdd', externalHDDScheme);