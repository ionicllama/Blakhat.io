/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var machineSchema = mongoose.Schema({

    name: {type: String, default: ""},
    DOMbackground: {type: String, default: ""},
    accountCost: {type: Number, default: 0}

});

machineSchema.methods = {};

// create the model for users and expose it to our app
module.exports = mongoose.model('bank', machineSchema);