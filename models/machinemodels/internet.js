/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var internetSchema = mongoose.Schema({

    upSpeed: {type: Number},
    downSpeed: {type: Number}

});

internetSchema.methods = {
    getName: function () {
        return sharedHelpers.internetHelpers.getInternetName(this);
    },
    getCost: function () {
        return sharedHelpers.internetHelpers.getInternetCost(this);
    },
    getModifier: function () {
        //todo: probably change this to be a bit more sophisticated
        return this.downSpeed * this.upSpeed;
    },
    getMegabyteSpeed: function () {
        return {
            downSpeed: this.downSpeed / 8,
            upSpeed: this.upSpeed / 8
        };
    }
};

module.exports = mongoose.model('internet', internetSchema);