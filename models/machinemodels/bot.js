/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var globalHelpers = require('../../helpers/globalHelpers');

var botSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    machine: {type: mongoose.Schema.Types.ObjectId, ref: 'machine', default: null},
    isAnalyzed: {type: Boolean, default: false}

});

botSchema.statics = {
    findPopulated: function (user, query, callback) {
        var subPopulate = [
            {
                path: 'machine',
                select: '_id ip password files',
                populate: {
                    path: 'files',
                    populate: [
                        'fileDef'
                    ],
                    match: {
                        isInstalled: true,
                        installedBy: user._id
                    }
                }
            },
            {
                path: 'cpu'
            },
            {
                path: 'gpu'
            },
            {
                path: 'hdd'
            },
            {
                path: 'externalHDD'
            },
            {
                path: 'internet'
            }
        ];
        this.find(query).populate(subPopulate).exec(function (err, bots) {
            if (err)
                return callback(err);

            return callback(null, bots);
        });
    },
    findByUserPopulated: function (user, callback) {
        this.findPopulated(user, {user: {_id: user._id}}, function (err, bots) {
            if (err)
                return callback(err);

            callback(null, bots);
        });
    },
    findByIdPopulated: function (_id, callback) {
        this.findPopulated({_id: _id}, function (err, bots) {
            if (err)
                return callback(err);

            callback(null, bots);
        });
    },
    findUserBotByMachine: function (user_id, machine_id, callback) {
        this.findOne({machine: {_id: machine_id}, user: {_id: user_id}}, function (err, bot) {
            if (err)
                return callback(err);

            callback(null, bot);
        });
    }
};

botSchema.methods = {};

module.exports = mongoose.model('bot', botSchema);