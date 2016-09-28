var express = require('express');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var path = require('path');

var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var machine = require('./controllers/machine');

var routes = require('./controllers/index');
var local = require('./controllers/localmachine');
var internet = require('./controllers/internet');
var finances = require('./controllers/finances');

var configDB = require('./config/database');

var _ = require('underscore');

// configuration
mongoose.connect(configDB.url); // connect to database

// required for passport
app.use(session({
    secret: 'thisisatributetothegreatessecret',
    // cookie: {maxAge: 60000},
    resave: false,
    saveUninitialized: false
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true,
    sourceMap: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/views', express.static('views'));

app.use(function (req, res, next) {
    res.locals = _.extend({}, res.locals, {
        path: req.url,
        isAuthenticated: req.isAuthenticated()
    });
    next();
});


//API Routes
app.use('/machine', machine);

//Web Routes
app.use('/', routes);
app.use('/localmachine', local);
app.use('/internet', internet);
app.use('/finances', finances);

require('./config/passport')(passport);
require('./controllers/users')(app, passport); // pass passport for configuration

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
