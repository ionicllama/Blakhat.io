var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    if (!req.isAuthenticated())
        res.render('pages/index', {title: 'Blakhat.io', message: req.flash('loginMessage')});
    else
        res.redirect('/local');
});

router.get('/signup', function (req, res) {
    res.render('pages/signup', {message: req.flash('signupMessage')});
});

router.get('/about', function (req, res) {
    res.render('pages/about');
});

module.exports = router;
