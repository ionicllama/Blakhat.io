/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var fileDefSchema = mongoose.Schema({

    name: {type: String, default: "no_name"},
    type: {type: String, default: 'txt'},
    level: {type: Number, default: 0},
    size: {type: Number, default: 0}

});

fileDefSchema.methods = {
    getName: function () {
        return sharedHelpers.fileHelpers.getFileName(this);
    },
    isVirus: function () {
        return sharedHelpers.fileHelpers.isVirus(this);
    },
    canInstall: function () {
        return this.isVirus();
    },
    canRun: function () {
        return sharedHelpers.fileHelpers.canRun(this);
    }
};

module.exports = mongoose.model('filedef', fileDefSchema);