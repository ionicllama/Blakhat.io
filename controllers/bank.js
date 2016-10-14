/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

var Machine = require('../models/machinemodels/machine');
var Bank = require('../models/bankmodels/bank');
var BankAccount = require('../models/bankmodels/bankaccount');

var auth = require('../middlewares/authMiddleware');

var bankHelpers = require('../helpers/bankHelpers');
var errorHelpers = require('../helpers/errorHelpers');

router.post('/account/', auth.isLoggedIn, function (req, res) {
    var response = {
        account: {},
        isAuthenticated: false
    };

    if (!req.body.bank._id || req.body.bank._id.toString().length == 0)
        return errorHelpers.returnError("Failed to create bank account.", res, "Bank account creation attempted without bank._id");

    Bank.findById(req.body.bank._id, function (err, bank) {
        if (err)
            return errorHelpers.returnError("Failed to create bank account.", res, err);

        if (bank) {
            if (bank.accountCost > 0) {
                if (!req.body.paymentAccount || req.body.paymentAccount.length <= 0)
                    return errorHelpers.returnError("Failed to create bank account.  No payment account supplied.", res, err);

                BankAccount.makePurchase(req.user, req.body.paymentAccount, bank.accountCost, function (UIError, err) {
                    if (UIError || err)
                        return errorHelpers.returnError(UIError, res, err);

                    createNewBankAccount(req.user, bank, res);
                });
            }
            else {
                createNewBankAccount(req.user, bank, res);
            }
        }
        else {
            res.json(response);
        }
    });
});

router.get('/account/:_id', auth.isLoggedIn, function (req, res) {
    var response = {
        bankAccount: {},
        isAuthenticated: false
    };
    if (req.params._id) {
        BankAccount.findById(req.params._id).populate('bank').exec(function (err, bankAccount) {
            if (err)
                console.log(err);

            if (bankAccount && req.user._id.toString() == bankAccount.user.toString())
                response = {
                    account: bankAccount,
                    isAuthenticated: req.user._id.toString() == bankAccount.user.toString()
                };

            if (req.query.sourceIP) {
                Machine.findByBank(bankAccount.bank._id, function (err, machine) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        machine.logBankAccountLogin(req.query.sourceIP, bankAccount.accountNumber);
                    }
                    res.json(response);
                });
            }
            else {
                res.json(response);
            }
        });
    }
    else {
        res.json(response)
    }
});

router.get('/account/', auth.isLoggedIn, function (req, res) {
    var response = {
        bankAccount: {},
        isAuthenticated: false
    };
    if (req.query.bank_id && req.query.accountNumber && req.query.password) {
        BankAccount.findByLogin(req.query.bank_id, req.query.accountNumber, req.query.password, function (err, bankAccount) {
            if (err)
                console.log(err);

            if (bankAccount) {
                response = {
                    account: bankAccount,
                    isAuthenticated: true
                };
                Machine.findByBank(bankAccount.bank._id, function (err, machine) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        machine.logBankAccountLogin(req.query.source, bankAccount.accountNumber);
                        res.json(response);
                    }
                });
            }
        });
    }
    else {
        res.json(response)
    }
});

router.get('/accounts/', auth.isLoggedIn, function (req, res) {
    var response = [];
    BankAccount.findByUser(req.user, function (err, bankAccounts) {
        if (err)
            console.log(err);

        if (bankAccounts && bankAccounts.length > 0) {
            for (var bankAccount in bankAccounts) {
                var accountInfo = {
                    account: bankAccounts[bankAccount],
                    isAuthenticated: true
                };
                response.push(accountInfo);
            }
        }

        res.json(response);
    });
});

router.patch('/account/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params._id)
        return errorHelpers.returnError_noId(res);

    if (!req.body.transfer || req.body.transfer.accountNumber.length == 0)
        return errorHelpers.returnError("No desination account number was entered", res);
    else if (!req.body.transfer.amount || req.body.transfer.amount == 0)
        return errorHelpers.returnError("You must transfer at least 1 dollar", res);

    BankAccount.findByLogin(null, req.body.account.accountNumber, req.body.account.password, function (err, bankAccount) {
        if (err || !bankAccount)
            return errorHelpers.returnError("This bank account no longer exists!", res, err);

        bankAccount.transferFundsFrom(req.body.transfer.accountNumber, req.body.transfer.amount, function (UIError, err) {
            if (err || UIError)
                return errorHelpers.returnError(UIError, res, err);

            res.json({
                account: bankAccount,
                isAuthenticated: true
            });
        });
    });
});

router.delete('/account/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params._id)
        return errorHelpers.returnError_noId(res);

    BankAccount.findById(req.params._id, function (err, bankAccount) {
        if (err)
            return errorHelpers.returnError("Couldn't find bank account with supplied _id", res, err);

        if (!bankAccount)
            return errorHelpers.returnError("Couldn't find bank account with supplied _id", res);

        if (bankAccount.user.toString() != req.user._id.toString())
            return errorHelpers.returnError("You can only delete your own bank accounts", res);

        bankAccount.remove(function (err) {
            if (err)
                return errorHelpers.returnError("Failed to delete the selected account", err, res);

            res.json(bankAccount);
        });
    });
});

function createNewBankAccount(user, bank, res) {
    var newAccount = new BankAccount({
            bank: bank._id,
            user: user._id
        }),
        response = {
            account: {},
            isAuthenticated: false
        };
    //this also saves it
    newAccount.generateAccountNumber(function (err) {
        if (err) {
            return errorHelpers.returnError("Failed to create bank account.", res, err);
        }
        else {
            BankAccount.populate(newAccount, 'bank', function (err, bank) {
                if (err)
                    console.log(err);
                else {
                    response = {
                        account: newAccount,
                        isAuthenticated: true
                    };
                }
                return res.json(response);
            });
        }
    });
}

module.exports = router;