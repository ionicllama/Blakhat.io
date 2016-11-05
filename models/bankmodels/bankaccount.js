/**
 * Created by Evan on 9/24/2016.
 */
var mongoose = require('mongoose');

var _ = require('underscore');

var Machine = require('../../models/machinemodels/machine');
var globalHelpers = require('../../helpers/globalHelpers');

var bankAccountSchema = mongoose.Schema({

    accountNumber: {type: String, default: "", unique: true},
    password: {type: String, default: globalHelpers.getRandomPassword()},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    bank: {type: mongoose.Schema.Types.ObjectId, ref: 'bank'},
    balance: {type: Number, default: 0, min: 0}

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
    generateAccountNumber: function (callback) {
        this.accountNumber = globalHelpers.getNewAccountNumber();
        var self = this;
        this.save(function (err) {
            if (err) {
                if (err.code === 11000)
                    return self.generateAccountNumber(callback);
                return callback(err);
            }
            callback();
        });
    },
    transferFundsFrom: function (destinationBankAccountNumber, amount, callback) {
        if (!destinationBankAccountNumber || destinationBankAccountNumber.length == 0) {
            return callback("No destination account number was entered");
        }
        else {
            var self = this;
            this.model('bankaccount').findByAccountNumber(destinationBankAccountNumber, function (err, destinationBankAccount) {
                if (err || !destinationBankAccount)
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

                        self.model('machine').findByBank(self.bank._id, function (err, sourceBankMachine) {
                            if (err || !sourceBankMachine)
                                console.log("Couldn't find bank machine.");

                            if (sourceBankMachine) {
                                self.model('machine').findByBank(destinationBankAccount.bank._id, function (err, destinationBankMachine) {
                                    if (err || !destinationBankMachine)
                                        console.log("Couldn't find bank machine.");

                                    if (destinationBankMachine) {
                                        sourceBankMachine.logBankTransfer(self.accountNumber, destinationBankAccount.accountNumber, destinationBankMachine.ip, amount);
                                    }
                                    return callback();
                                });
                            }
                            else {
                                return callback();
                            }
                        });
                    });
                });

            })
        }
    },
    collectBotProfit: function (user, bot, callback) {
        if (user._id.toString() != this.user.toString())
            return callback("You do not own the selected bank account.");
        else if (!bot || bot.user.toString() != user._id.toString())
            return callback("You do not have permission to collect the profit on this bot.");

        this.balance = this.balance + bot.profit;
        bot.profit = 0;
        bot.lastCalculatedOn = new Date();
        this.save(function (err) {
            if (err)
                return callback("Failed to collect profit.", err);

            bot.save(function (err) {
                if (err)
                    console.log(err);

                return callback();
            });
        });
    },
    makePurchase: function (user, amount, callback) {
        if (this.balance < amount) {
            return callback("This account no longer has enough funds to purchase this item.");
        }
        else if (user._id.toString() != this.user.toString()) {
            //this should never happen
            //this is here for a second validation after client side to prevent cheating
            return callback("You do not own the selected bank account.");
        }

        this.balance = this.balance - amount;
        this.save(function (err) {
            if (err)
                return callback("Failed to purchase the selected item.", err);

            return callback();
        });
    }
};

module.exports = mongoose.model('bankaccount', bankAccountSchema);