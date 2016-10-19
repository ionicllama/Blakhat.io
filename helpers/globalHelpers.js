/**
 * Created by Evan on 9/27/2016.
 */
var sharedHelpers = require('../public/js/sharedHelpers').sharedHelpers;

var globalHelpers = {
    getNewIP: function () {
        return sharedHelpers.randomNumber_255(2) +
            "." +
            sharedHelpers.randomNumber_255() +
            "." +
            sharedHelpers.randomNumber_255() +
            "." +
            sharedHelpers.randomNumber_255();
    },
    getRandomPassword: function () {
        return Math.random().toString(32).slice(2).substr(0, 10);
    },
    getNewAccountNumber: function () {
        //always generate a 10 digit account number
        return Math.floor((Math.random() * (99 - 10) + 10) * 100000000).toString();
    }
};

module.exports = globalHelpers;