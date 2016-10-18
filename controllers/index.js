var express = require('express');
var router = express.Router();

var _ = require('underscore');

router.use('/machine', require('../controllers/machine'));
router.use('/bot', require('../controllers/bot'));
router.use('/machineParts/', require('../controllers/machineParts'));
router.use('/internetcontent', require('../controllers/internetcontent'));
router.use('/bank', require('../controllers/bank'));

router.get('/signup', function (req, res) {
    res.locals = _.extend({}, res.locals, {
        page: 'signup',
        title: 'Blakhat.io | Sign Up',
        message: req.flash('signupMessage')
    });
    res.render('pages/index');
});

router.get('/about', function (req, res) {
    res.locals = _.extend({}, res.locals, {
        title: 'Blakhat.io | About',
        page: 'about'
    });
    res.render('pages/index');
});

/* Catch All GET - For Single Page App. */
router.get('*', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.locals = _.extend({}, res.locals, {
            page: 'login',
            title: 'Blakhat.io',
            message: req.flash('loginMessage')
        });
        res.render('pages/index');
    }
    else {
        res.locals = _.extend({}, res.locals, {
            page: 'app',
            title: 'Blakhat.io'
        });
        res.render('pages/index');
    }
});

module.exports = router;
