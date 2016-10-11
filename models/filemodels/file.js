/**
 * Created by Evan on 9/24/2016.
 */
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var mongoose = require('mongoose');

var fileSchema = mongoose.Schema({

    name: {type: String, default: "no_name"},
    type: {type: String, default: 'txt'},
    level: {type: Number, default: 0},
    size: {type: Number, default: 0}

});

fileSchema.methods = {
    getName: function () {
        return sharedHelpers.fileHelpers.getFileName(this);
    }
};

// create the model for users and expose it to our app
module.exports = mongoose.model('file', fileSchema);