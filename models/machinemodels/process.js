/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var Machine = require('../../models/machinemodels/machine');

var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;
var globalHelpers = require('../../helpers/globalHelpers');

var processSchema = mongoose.Schema({

    processMachine: {type: mongoose.Schema.Types.ObjectId, ref: 'machine'},
    start: {type: Date, default: new Date()},
    end: {type: Date, default: null},
    type: {type: String, default: ""},
    file: {type: String, default: ""},
    machine: {type: mongoose.Schema.Types.ObjectId, ref: 'machine'},
    bankAccount: {type: mongoose.Schema.Types.ObjectId, ref: 'bankaccount'}

});

processSchema.statics = {
    types: {
        CRACK_PASSWORD_MACHINE: 0,
        CRACK_PASSWORD_BANK: 1,
        FILE_DOWNLOAD: 2,
        FILE_UPLOAD: 3
    },
    findByMachine: function (_id, callback) {
        this.find({processMachine: {_id: _id}}).populate(['processMachine', 'machine', 'bankAccount']).exec(function (err, processes) {
            if (err)
                return callback(err);

            return callback(null, processes);
        });
    }

};

processSchema.methods = {};

// create the model for users and expose it to our app
module.exports = mongoose.model('process', processSchema);