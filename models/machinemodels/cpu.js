/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var globalHelpers = require('../../helpers/globalHelpers');
var mongoose = require('mongoose');

var cpuSchema = mongoose.Schema({

    cores: {type: Number, default: 1},
    speed: {type: Number, default: 666}

});

cpuSchema.methods = {
    getName: function () {
        return this.cores.toString() + "-core, " + this.speed.toString() + " MHz";
    }
};

// create the model for users and expose it to our app
module.exports = mongoose.model('cpu', cpuSchema);