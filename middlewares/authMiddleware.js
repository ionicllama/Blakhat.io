/**
 * Created by Evan on 9/25/2016.
 */
// route middleware to make sure a user is logged in
module.exports = {
    isLoggedIn: function (req, res, next) {
        if (req.isAuthenticated())
            return next();

        res.redirect('/');
    }
};