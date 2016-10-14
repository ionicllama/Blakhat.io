/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var globalHelpers = require('../../helpers/globalHelpers');

var botSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    machine: {type: mongoose.Schema.Types.ObjectId, ref: 'machine', default: null}

});

botSchema.statics = {
    findUserBotByMachine: function (user_id, machine_id, callback) {
        this.findOne({machine: {_id: machine_id}, user: {_id: user_id}}, function (err, bot) {
            callback(err, bot);
        });
    }
};

botSchema.methods = {};

module.exports = mongoose.model('bot', botSchema);