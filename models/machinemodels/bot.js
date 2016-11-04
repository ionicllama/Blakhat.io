/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var globalHelpers = require('../../helpers/globalHelpers');
var sharedHelpers = require('../../public/js/sharedHelpers').sharedHelpers;

var botSchema = mongoose.Schema({

    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null},
    machine: {type: mongoose.Schema.Types.ObjectId, ref: 'machine', default: null},
    isAnalyzed: {type: Boolean, default: false},
    job: {type: Number, default: null},
    jobStartedOn: {type: Date, default: null},
    lastCalculatedOn: {type: Date, default: null},
    profit: {type: Number, default: 0}

});

botSchema.statics = {
    findPopulated: function (user, query, callback) {
        var populate = [
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
        if (query._id) {
            this.findOne(query).populate(populate).exec(function (err, bots) {
                if (err)
                    return callback(err);

                return callback(null, bots);
            });
        }
        else {
            this.find(query).populate(populate).exec(function (err, bots) {
                if (err)
                    return callback(err);

                return callback(null, bots);
            });
        }
    },
    findByUserPopulated: function (user, callback) {
        this.findPopulated(user, {user: {_id: user._id}}, function (err, bots) {
            if (err)
                return callback(err);

            callback(null, bots);
        });
    },
    findByIdPopulated: function (user, _id, callback) {
        this.findPopulated(user, {_id: _id}, function (err, bots) {
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

botSchema.methods = {
    setProfit: function () {
        if (!this.lastCalculatedOn && this.jobStartedOn)
            this.lastCalculatedOn = this.jobStartedOn;
        if (this.job != null && this.lastCalculatedOn) {
            this.profit = sharedHelpers.botHelpers.getProfit(this);
            this.lastCalculatedOn = new Date();
        }
    }
};

module.exports = mongoose.model('bot', botSchema);