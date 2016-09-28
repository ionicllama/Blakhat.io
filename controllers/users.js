var auth = require('../middlewares/authMiddleware');

module.exports = function (app, passport) {

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/localmachine', // redirect to the user home
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/localmachine', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the login page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
};