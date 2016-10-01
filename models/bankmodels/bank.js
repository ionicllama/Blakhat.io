/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var purchasingHelpers = require('../../helpers/purchasingHelpers');

var machineSchema = mongoose.Schema({

    name: {type: String, default: ""}

});

machineSchema.methods = {};

// create the model for users and expose it to our app
module.exports = mongoose.model('bank', machineSchema);