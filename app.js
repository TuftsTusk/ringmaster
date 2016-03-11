// Plugins
var uuid = require('uuid')
express = require('express'),
path = require('path'),
favicon = require('serve-favicon'),
logger = require('morgan'),
cors = require('cors'),
MongoClient = require('mongodb').MongoClient,
format = require('util').format,
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
mongoose = require('mongoose'),
bcrypt = require('bcrypt-nodejs'),
mailer = require('nodemailer');

// Tusk Libraries
var Validate = require('./lib/validation.js');
var Utils = require('./lib/utils.js');
var Consts = require('./lib/consts.js');

// Load Middleware
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');

// Tusk Routes
var UserRoutes = require('./lib/route/user.js');
var ListingRoutes = require('./lib/route/listing.js');
var TestingRoutes = require('./lib/route/testing.js');

/* Possible values:
 *   undefined - NODE_ENV is not set. This should be treated as a FATAL error.
 * development - Development environment, enable debug logging, etc.
 *     staging - Staging server, perhaps allowing additional test code or authentication.
 *  production - Live, production environment that is public-facing. No debug output!
 */
if (Consts.ENV < 0) {
    if (Consts.ENV === Consts.UNDEF)
        console.log("NODE_ENV variable not set. App will not execute until it is assigned a value.");
    if (Consts.ENV === Consts.UNKWN)
        console.log("NODE_ENV variable assigned to an unrecognized value.");
    console.log("Possible values: development, staging, production");
    process.exit(1);
}

var whitelist = ['http://localhost:8080', 'https://tuskdumbo.herokuapp.com', 'http://tuskmarketplace.com', 'https://tuskmarketplace.com', 'https://tuskdumbostaging.herokuapp.com'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  }
};
app.use(cors({credentials: true, origin: true}));

app.options('*', cors(corsOptions));

// Session related plugins
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// Database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/tusk';
mongoose.connect(mongoUri);

app.use(session({
    secret: 'tuskislovetuskislife',
    cookie: {
        expires: Consts.genDefaultExpires(),
        maxAge: Consts.getDefaultMaxAge()
    },
    saveUninitialized: false,
    resave: true,
    rolling: true,
    unset: 'destroy',
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.use(TestingRoutes.ensureEnv);

/*
 *   Method | GET
 *
 *    Route | /user/:id/confirm
 *
 *   Params | :id - mongo id of unconf_user account
 *          | key - confirmation key as generated by /user/register
 *
 * Response | success | {success: true, message: String}
 *          | failure | {success: false, type: ErrString, message: String}
 *
 *   Errors | INVALID_USER_ID - No unconfirmed user with that id was found
 *          | DISK_SAVE_FAILURE - A confirmed user account could not be saved to disk
 *          | INVALID_CONFIRMATION_KEY - The provided confirmation key did not match
 *                                         that on file for that user
 */
app.get('/user/:id/confirm', UserRoutes.getUserConfirmById);

/*
 *   Method | POST
 *
 *    Route | /user/register
 *
 *   Params | email - email as provided by the user
 *          | password - password as provided by the user
 *          | confirmpass - confirm password as provided
 *
 * Response | success | {success: true, message: String}
 *          | failure | {success: false, type: ErrString, message: String}
 *
 *   Errors | MISSING_REGISTRATION_FIELD_FAILURE - One of the params was missing
 *          | TUFTS_EMAIL_VALIDATION_FAILURE - The email used for registration was not a valid Tufts email
 *          | EMAIL_IN_USE_FAILURE - The email used for registration was already in use
 *          | PASSWORD_MISMATCH_FAILURE - The password and confirmpass fields did not match
 *          | DISK_SAVE_FAILURE - The user account failed to save to disk
 */
app.post('/me/register', UserRoutes.postMeRegister);

/*
 *   Method | POST
 *
 *    Route | /user/logout
 *
 *   Params | none
 *
 * Response | success | {success: true, message: String}
 *          | failure | {success: false, type: ErrString, message: String}
 *
 *   Errors | LOGIN_SESSION_NOT_FOUND_FAILURE - The user was either not logged in or they had
 *                                                an invalid session cookie
 */
app.post('/me/logout', UserRoutes.postMeLogout);

/*
 *   Method | POST
 *
 *    Route | /user/login
 *
 *   Params | none
 *
 * Response | success | {success: true, message: String}
 *          | failure | {success: false, type: ErrString, message: String}
 *
 *   Errors | LOGIN_SESSION_NOT_FOUND_FAILURE - The user was either not logged in or they had
 *                                                an invalid session cookie
 */
app.post('/me/login', UserRoutes.postMeLogin);

app.put('/me/password', UserRoutes.putMyPassword);

app.get('/me/listing', ListingRoutes.getMeListing);

app.get('/me/listing/filter/:filter', ListingRoutes.getMeListingByFilter);

app.post('/user/:email/recover', UserRoutes.postUserRecoverByEmail);

app.route('/listing')
    .post(ListingRoutes.postListing)
    .get(ListingRoutes.getListing);

app.get('/listing/:uid', ListingRoutes.getListingById);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

if (Consts.ENV === Consts.DEV || Consts.ENV === Consts.STG) {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

app.listen(process.env.PORT || 80);

module.exports = app;
