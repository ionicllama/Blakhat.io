var express = require('express');
var router = express.Router();

var _ = require('underscore');

/* GET home page. */
router.get('/', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.locals = _.extend({}, res.locals, {
            page: 'login',
            title: 'Blakhat.io',
            message: req.flash('loginMessage')
        });
        res.render('pages/index');
    }
    else
        res.redirect('/localmachine');
});

router.get('/signup', function (req, res) {
    res.locals = _.extend({}, res.locals, {
        page: 'signup',
        message: req.flash('signupMessage')
    });
    res.render('pages/index');
    //res.render('pages/index', {message: req.flash('signupMessage')});
});

router.get('/about', function (req, res) {
    res.locals = _.extend({}, res.locals, {
        page: 'about'
    });
    res.render('pages/index');
});

module.exports = router;
