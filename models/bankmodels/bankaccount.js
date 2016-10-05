/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var globalHelpers = require('../../helpers/globalHelpers');

var bankAccountSchema = mongoose.Schema({

    accountNumber: {type: String, default: generateNewAccountNumber()},
    password: {type: String, default: globalHelpers.getRandomPassword()},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    bank: {type: mongoose.Schema.Types.ObjectId, ref: 'bank'},
    balance: {type: Number, default: 0}

});

bankAccountSchema.statics = {
    findByUser: function (user, callback) {
        this.find({user: {_id: user._id}}).populate('bank').exec(function (err, bankAccounts) {
            if (err)
                callback(err);

            callback(null, bankAccounts);
        });
    },
    findByLogin: function (bank_id, accountNumber, password, callback) {
        var query = {
            accountNumber: accountNumber,
            password: password
        };
        if (bank_id && bank_id.toString().length > 0) {
            query.bank = {
                _id: bank_id
            };
        }
        this.findOne(query).populate('bank').exec(function (err, bankAccount) {
            callback(err, bankAccount);
        });
    },
    findByAccountNumber: function (accountNumber, callback) {
        this.findOne({accountNumber: accountNumber}).populate('bank').exec(function (err, bankAccount) {
            callback(err, bankAccount);
        });
    },
    makePurchase: function (user, paymentAccount, amount, callback) {
        this.findOne({_id: paymentAccount, user: {_id: user._id}}, function (err, bankAccount) {
            if (err)
                return callback(null, err);

            if (!bankAccount || bankAccount.balance < amount)
                return callback("The selected account doesn't have enough funds to make this purchase.");

            bankAccount.balance = bankAccount.balance - amount;
            bankAccount.save(function (err) {
                if (err)
                    return callback("Failed to make the purchase.");

                callback();
            });
        });
    }
};

bankAccountSchema.methods = {
    transferFundsFrom: function (destinationBankAccountNumber, amount, callback) {
        if (!destinationBankAccountNumber || destinationBankAccountNumber.length == 0) {
            return callback("No destination account number was entered");
        }
        else {
            var self = this;
            this.model('bankaccount').findByAccountNumber(destinationBankAccountNumber, function (err, destinationBankAccount) {
                if (err)
                    return callback("Couldn't find destination account", err);

                if (self.balance < amount)
                    return callback("This account no longer has enough funds to transfer the requested amount.");

                self.balance = self.balance - amount;
                destinationBankAccount.balance = destinationBankAccount.balance + amount;
                destinationBankAccount.save(function (err) {
                    if (err)
                        return callback("Couldn't transfer funds.");

                    self.save(function (err) {
                        if (err)
                            console.log(err + " - Failed to change balance of the source bank account during a transfer.");

                        callback();
                    });
                });

            })
        }
    }
};

function generateNewAccountNumber() {
    //generate random 10 digit account numbers until we find one that doesn't exist yet
    var validAccount = false,
        accountNumber;
    // do {
    //     accountNumber = Math.floor(Math.random() * 10000000000).toString();
    //     bankHelpers.getBankAccount({accountNumber: accountNumber}, function (bankAccount) {
    //         if (!bankAccount)
    //             validAccount = true;
    //     });
    // }
    // while (!validAccount);
    // return accountNumber;
    return Math.floor(Math.random() * 10000000000).toString();
}

module.exports = mongoose.model('bankaccount', bankAccountSchema);