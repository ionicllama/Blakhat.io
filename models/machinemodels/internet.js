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
    }
};

// create the model for users and expose it to our app
module.exports = mongoose.model('internet', internetSchema);