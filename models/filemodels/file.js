/**
 * Created by Evan on 9/24/2016.
 */
var User = require('../../models/user');
var FileDef = require('../../models/filemodels/filedef');

var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({

    fileDef: {type: mongoose.Schema.Types.ObjectId, ref: 'filedef', default: null},
    name: {type: String, default: null},
    isLocked: {type: Boolean, default: false},
    isInstalled: {type: Boolean, default: false},
    hidden: {type: Number, default: null},
    uploadedOn: {type: Date, default: new Date()},
    installedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    lastCollected: {Type: Date}

});

fileSchema.methods = {
    getName: function () {
        return sharedHelpers.fileHelpers.getFileName(this);
    }
};

module.exports = mongoose.model('file', fileSchema);