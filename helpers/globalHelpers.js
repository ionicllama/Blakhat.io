/**
 * Created by Evan on 9/27/2016.
 */
var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;

var globalHelpers = {
    getNewIp: function () {
        return sharedHelpers.randomNumber_255(2) +
            "." +
            sharedHelpers.randomNumber_255() +
            "." +
            sharedHelpers.randomNumber_255() +
            "." +
            sharedHelpers.randomNumber_255();
    },
    getRandomPassword: function () {
        //todo: generates a random 10 character alphanumeric password
        return Math.random().toString(32).slice(2).substr(0, 10);
    }
};

module.exports = globalHelpers;