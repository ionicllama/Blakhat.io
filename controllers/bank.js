/**
 * Created by Evan on 9/24/2016.
 */
var express = require('express');
var router = express.Router();

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
                //todo: check if the user has enough funds in other bank accounts
                return errorHelpers.returnError("Failed to create bank account.  Not enough funds in other accounts.", res, err);
            }
            var newAccount = new BankAccount({
                bank: bank._id,
                user: req.user._id
            });
            newAccount.save(function (err) {
                if (err)
                    return errorHelpers.returnError("Failed to create bank account.", res, err);

                BankAccount.populate(newAccount, 'bank', function (err, bank) {
                    if (err)
                        console.log(err);

                    response = {
                        account: newAccount,
                        isAuthenticated: true
                    };
                    res.json(response);
                });
            });
        }
    });
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
            }
            res.json(response);
        });
    }
    else {
        res.json(response)
    }
});

// router.get('/:_id', auth.isLoggedIn, function (req, res) {
//     if (req.params && req.params._id) {
//
//     }
//     else {
//         errorHelpers.returnError_get_noId();
//     }
// });

router.patch('/account/:_id', auth.isLoggedIn, function (req, res) {
    if (!req.params._id)
        return errorHelpers.returnError_noId(res);

    if (req.params.transfer) {
        if (!req.params.transfer.accountNumber)
            return errorHelpers.returnError("No desination account number was entered");
        else if (!req.params.transfer.amount || req.params.transfer.amount == 0)
            return errorHelpers.returnError("You must transfer at least 1 dollar");

        BankAccount.findByLogin(null, req.params.account.accountNumber, req.params.account.password, function (err, bankAccount) {
            if (err || !bankAccount)
                return errorHelpers.returnError("This bank account no longer exists!", res, err);

            bankAccount.transferFundsFrom(req.params.transfer.accountNumber, req.params.transfer.amount, function (UIError, err) {
                if (err || UIError)
                    return errorHelpers.returnError(UIError, res, err);

                res.json({
                    account: bankAccount,
                    isAuthenticated: true
                });
            });
        });
    }
});

module.exports = router;