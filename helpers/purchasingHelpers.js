/**
 * Created by Evan on 9/27/2016.
 */
var User = require('../models/user');

var purchasingHelpers = {
    processPurchase: function (user, cost, callback) {
        //temporary for testing
        cost = 0;
        if (user.money >= cost) {
            user.money = Math.floor(user.money - cost);
            user.save(function (err) {
                if (err) {
                    console.log(err);
                    callback("Failed to purchase item.");
                    return;
                }

                callback();
            });
        }
        else {
            callback(new Error("You don't have enough money to purchase this item."));
        }
    }
};

module.exports = purchasingHelpers;