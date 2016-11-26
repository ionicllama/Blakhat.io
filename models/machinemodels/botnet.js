/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var globalHelpers = require('../../helpers/globalHelpers');
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;

var botnetSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    name: {type: String, default: ""},
    bots: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'bot',
        default: null
    }],
    job: {type: Number, default: null},
    jobStartedOn: {type: Date, default: null}

});

botnetSchema.statics = {
    findPopulated: function (user, query, callback) {
        var populate = [{
            path: 'bots',
            // select: '_id user machine isAnalyzed job jobStartedOn lastCalculatedOn profit botnet',
            populate: [{
                path: 'machine',
                select: '_id ip cpu gpu internet password files',
                populate: [
                    {
                        path: 'files',
                        populate: [
                            'fileDef'
                        ],
                        match: {
                            isInstalled: true,
                            installedBy: user._id
                        }
                    },
                    {
                        path: 'cpu'
                    },
                    {
                        path: 'gpu'
                    },
                    {
                        path: 'internet'
                    }
                ]
            }]
        }];
        if (query._id) {
            this.findOne(query).populate(populate).exec(function (err, botnet) {
                if (err)
                    return callback(err);
                return callback(null, botnet);
            });
        }
        else {
            this.find(query).populate(populate).exec(function (err, botnets) {
                if (err)
                    return callback(err);
                return callback(null, botnets);
            });
        }
    },
    findByUserPopulated: function (user, callback) {
        this.findPopulated(user, {user: {_id: user._id}}, function (err, botnets) {
            if (err)
                return callback(err);

            callback(null, botnets);
        });
    },
    findByUserNotPopulated: function (user, callback) {
        this.find({user: {_id: user._id}}).select('_id').exec(function (err, botnets) {
            if (err)
                return callback(err);

            callback(null, botnets);
        });
    },
    findByIdPopulated: function (user, _id, callback) {
        this.findPopulated(user, {_id: _id}, function (err, botnets) {
            if (err)
                return callback(err);

            callback(null, botnets);
        });
    }
};

botnetSchema.methods = {};

module.exports = mongoose.model('botnet', botnetSchema);