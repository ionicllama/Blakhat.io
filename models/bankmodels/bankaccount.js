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
    }
};

bankAccountSchema.methods = {
    transferFundsFrom: function (destinationAccount, amount, callback) {
        if (!destinationAccount || destinationAccount.length == 0) {
            return callback("No destination account number was entered");
        }
        else {
            BankAccount.findByAccountNumber(destinationAccount, function (err, sourceBankAccount) {
                if (err)
                    return callback("Couldn't find destination account", err);

                var newDestinationBalance = bankAccount + amount;
                var newSourceBalance = self.balance - amount;

                bankAccount.update({balance: newDestinationBalance}, function (err, destinationBankAccount) {
                    if (err)
                        return callback("Couldn't transfer funds.");

                    self.update({balance: newSourceBalance}, function (err, sourceBankAccount) {
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