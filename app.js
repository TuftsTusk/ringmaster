// Plugins
var uuid = require('uuid')
express = require('express'),
path = require('path'),
favicon = require('serve-favicon'),
logger = require('morgan'),
cors = require('cors'),
MongoClient = require('mongodb').MongoClient, format = require('util').format,
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
mongoose = require('mongoose'),
validator = require('validator'),
bcrypt = require('bcrypt-nodejs'),
mailer = require('nodemailer');

// load Schema
var Listings = require('./models/listing.js');
var Unconf_User = require('./models/unconf_user.js');
var User = require('./models/user.js');

// Tusk Libraries
var Validate = require('./lib/validation.js');
var Utils = require('./lib/utils.js');
var Consts = require('./lib/consts.js');

// Configuration
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');

var UNDEF = -1,
    UNKWN = -2,
    DEV   =  0,
    STG   =  1,
    PROD  =  2;

var ENVS = {
    "undefined": UNDEF,
    "unknown": UNKWN,
    "development": DEV,
    "staging": STG,
    "production": PROD
};
var raw_ENV = process.env.NODE_ENV;
var ENV = (raw_ENV in ENVS)?ENVS[raw_ENV]:UNKWN;
/* Possible values:
 *   undefined - NODE_ENV is not set. This should be treated as a FATAL error.
 * development - Development environment, enable debug logging, etc.
 *     staging - Staging server, perhaps allowing additional test code or authentication.
 *  production - Live, production environment that is public-facing. No debug output!
 */
if (ENV < 0) {
    if (ENV === UNDEF)
        console.log("NODE_ENV variable not set. App will not execute until it is assigned a value.");
    if (ENV === UNKWN)
        console.log("NODE_ENV variable assigned to an unrecognized value.");
    console.log("Possible values: development, staging, production");
    process.exit(1);
}

function log(obj) {
    if (ENV === DEV || ENV === STG) {
        console.log(obj);
    }
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

if (ENV === DEV || ENV === STG)
    app.get('/users', function(request, response) {
        response.set('Content-Type', 'application/json');
        User.find({}, function(err, users) {
            if (!err) {
                return response.status(200).send(JSON.stringify({
                    users: users
                }));
            } else
                return sendEnvConfigFailure(response);
        });
    });



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
app.get('/user/:id/confirm', function(request, response) {
    Unconf_User.findOne({_id: request.params.id}, function(err, user) {
        if (err) {
            return response.status(400).send(error(
                'INVALID_USER_ID',
                'Invalid user id'
            ));
        } else {
            if (request.query.key === user.confirmationKey) {
                user.remove();

                var newuser = new User;
                newuser.email = user.email;
                newuser.passwordHash = user.passwordHash;
                newuser.passwordSalt = user.passwordSalt;

                newuser.save(function (err) {
                    if (err) {
                        return response.status(500).send(error(
                            'DISK_SAVE_FAILURE',
                            err
                        ));
                    } else {
                        return response.sendStatus(204);
                    }
                });
            } else {
                return response.status(400).send(error(
                    'INVALID_CONFIRMATION_KEY',
                    'The confirmation key provided was invalid'
                ));
            }
        }
    });
});

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
app.post('/user/register', function(request, response) {
    response.set('Content-Type', 'application/json');
    if (!Validate.checkForKeys(["email", "password", "confirmpass"], request.body)) {
        return response.status(400).send(error(
            'MISSING_REGISTRATION_FIELD_FAILURE',
            "One or more of the registration fields was missing"
        ));
    } else {
        var email = Validate.normalizeEmail(request.body.email);
        if (!Validate.validateTuftsEmail(email)) {
            return response.status(400).send(error(
                'TUFTS_EMAIL_VALIDATION_FAILURE',
                'Email must be a tufts email'
            ));
        } else {
            /*
             *  1. Check if the email is currently in use
             *      a. Normalize the email
             *            i. Gmail addresses ignore dots (.) in the email name
             *           ii. Others?
             *      b. If the email is in use, then report as such
             *  2. If the email is not in use, but there is an unverified entry for that email
             *      a. If so, check the timestamp
             *             i. If the existing entry is over 1 hour old, then delete it and
             *                  replace it with a new entry
             *            ii. If the existing entry is less than 1 hour old, report the email
             *                  as recently registered (and re-send the confirmation email?)
             *  3. If the email is not in use, nor is there an unconfirmed account for that email
             *      a. Create an unconfirmed account for that email and send the confirmation
             *          email. Report as such.
             */
            User.findOne({email:email}, function(err, user) {
                if (user) {
                    return response.status(400).send(error(
                        'EMAIL_IN_USE_FAILURE',
                        'Email is already in use'
                    ));
                }
                var password = request.body.password;
                if (password != request.body.confirmpass) {
                    return response.status(400).send(error(
                        'PASSWORD_MISMATCH_FAILURE',
                        'Passwords did not match'
                    ));
                } else {
                    Unconf_User.findOne({email: email}, function(err, user) {
                        if (user) {
                            var now = (new Date()).getTime();
                            if (user.when.getTime() - now > 60000) {
                                //TODO: This logic if the unconfirmed user is still hangin around
                            } else {

                            }
                            user.remove();
                        }
                        var newuser = new Unconf_User;

                        newuser.email = email;

                        var salt = bcrypt.genSaltSync(10);

                        newuser.passwordSalt = salt;
                        newuser.passwordHash = bcrypt.hashSync(password, salt);

                        confirmKey = Utils.md5(salt + email);

                        newuser.confirmationKey = confirmKey;

                        newuser.save(function(err) {
                            if (!err) {
                                if (ENV === DEV || ENV === STG) {
                                    return response.status(200).send(JSON.stringify({
                                        email: email,
                                        id: newuser._id,
                                        key: confirmKey
                                    }));
                                } else {
                                    //TODO: Generate and send confirmation email
                                }
                            } else {
                                return response.status(400).send(error(
                                    'DISK_SAVE_FAILURE',
                                    err
                                ));
                            }
                        });
                    });
                }
            });
        }
    }
});

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
app.post('/user/logout', function(request, response) {
    //ensure client clears their cookies
    response.clearCookie('connect.sid');
    if ('login' in request.session) {
        delete request.session;
        return response.sendStatus(204);
    }
    return response.status(400).send(error(
        'LOGIN_SESSION_NOT_FOUND_FAILURE',
        'Unsuccessfully logged out because not logged in'
    ));
});

if (ENV === DEV || ENV === STG) {
    app.delete('/unconf_user/:email', function(request, response) {
        Unconf_User.findOneAndRemove({email:Validate.normalizeEmail(request.params.email)}, function(err, resp) {
            if (err || !resp) {
                return response.status(500).send(error('UNCONF_USER_DELETION_FAILURE', 'An unconfirmed user account failed to be deleted'));
            } else {
                return response.sendStatus(204);
            }
        });
    });

    app.delete('/user/:email', function(request, response) {
        User.findOneAndRemove({email:request.params.email}, function(err, user) {
            if (err || !user) {
                return reponse.status(404).send();
            } else {
                return response.sendStatus(204);
            }
        });
    });

    app.delete('/all', function(request, response) {
        User.remove({});
        Unconf_User.remove({});
        Listing.remove({});
        response.sendStatus(204)
    });
}

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
app.post('/user/login', function(request, response) {
    if ("login" in request.session && "tries" in request.session.login) {
        var diff = Date.now() - request.session.login.when;
        if (diff > (3 * 60 * 1000))
            delete request.session.login;
        else if (request.session.login.tries > 5) {
            return response.status(429).send(error(
                'EXCESS_LOGIN_ATTEMPTS_FAILURE',
                'Too many login attempts—wait a few minutes and try again.'
            ));
        }
    }
    User.findOne({email:request.body.email}, function(err, user) {
        if (err) {
            reponse.status(400).send(JSON.stringify({message: err}));
        } else if (!user) {
            response.status(404).send(error('USER_NOT_FOUND_FAILURE', 'The user with that email was not found'));
        } else if (bcrypt.hashSync(request.body.password, user.passwordSalt) === user.passwordHash) {
            request.session.login = {
                valid: true,
                when: Date.now(),
                who: {
                    id: user._id,
                    email: user.email
                }
            };
            return response.status(204).send();
        } else {
            var t = (request.session.login != undefined && "tries" in request.session.login)?(request.session.login.tries+1):1;
            request.session.login = {valid: false, tries: t, when: Date.now()};
            return response.status(400).send(JSON.stringify({message: "Email/password combo was incorrect"}));
        }
    });
});

app.put('/user/password', function(request, response) {
    if (!request.session.login || !request.session.login.valid) {
        return response.status(400).send(error('NOT_LOGGED_IN_FAILURE', 'User not logged in'));
    } else {
        User.findOne({_id: request.session.login.who.id}, function(err, user) {
            if (err) {

            } else if (!user) {

            } else {

            }
        });
    }
});

app.post('/user/:email/recover', function(request, response) {
    response.set('Content-Type', 'application/json');
    var email = request.params.email;
    User.findOne({email:validator.normalizeEmail(email)}, function(err, user) {
        if (err || !user) {
            return response.status(501).send(error(
                'ACCOUNT_RECOVERY_FAILURE',
                'The account password could not be recovered'
            ));
        }
        key = Utils.md5((Date.now() % 23623) + user.password);
        user.recovery.requested = true;
        user.recovery.key = key;
        user.recovery.when = Date.now();
        
        if (ENV === PROD) {
            //TODO: Generate email and blast it off
            return sendNotYetImplementedFailure(response);
        } else if (ENV === DEV || ENV === STG) {
            return response.status(200).send(JSON.stringify({
                id: user._id,
                confirm_key: key
            }));
        } else {
            return sendEnvConfigFailure(response);
        }   
    });
});

app.get('/alive', function(request, response){
  return response.send('yes thank you');
});

function error(type, message) {
    return JSON.stringify({
        type: type,
        message: message
    });
}

function sendEnvConfigFailure(response) {
    return response.status(500).send(error(
        'ENVIRONMENT_MISCONFIGURATION_FAILURE',
        'The local environment was configured incorrectly'
    ));
}

function sendNotYetImplementedFailure(response) {
    return response.status(501).send(error('NOT_YET_IMPLEMENTED_FAILURE', 'Not yet implemented'));
}

function ensureLoginSession(request) {
    if (request.session.login &&
        request.session.login.valid &&
        request.session.login.who.id) {
        return true;
    }
    return false;
}

function makeNewListingFromPost(body, user_id) {
    if (body.type) {
        if (body.type === Listings.MISC) {
            var miscListing = new Listings.MiscListing;
            miscListing.title = body.title;
            miscListing.body = body.body;
            miscListing.user_id = user_id;
            return {
                type: Listings.MISC,
                listing: miscListing
            };
        }
    }
    return false;
}

app.route('/listing')
    .post(function(request, response) {
        response.set('Content-Type', 'application/json');

        if (!ensureLoginSession(request)) {
            return response.status(400).send(error(
                'NOT_LOGGED_IN_EXCEPTION',
                'Listing could not be posted because the user is not logged in'
            ));
        }
        
        var newListing = makeNewListingFromPost(request.body, request.session.login.who.id);
        if (!newListing) {
            return response.status(400).send(JSON.stringify({
                type: 'LISTING_INVALID_DATA_EXCEPTION',
                message: 'Listing data did not contain all requisite fields'
            }));
        } else {
            newListing.listing.save(function (err) {
                if (!err) {
                    return response
                            .status(201)
                            .set('Location', '/listing/'+newListing.listing._id)
                            .send({rsc_id: newListing.listing._id});
                } else {
                    return response.status(500).send(error('DISK_SAVE_FAILURE', err));
                }
            });
        }
    })
    .get(function(request,response){
      response.set('Content-Type', 'application/json');
         return Listings.Listing.find(function (err, listings) {
            if (!err){
              return response.status(200).send(listings.reverse());
            } else {
              return response.status(404).send('{}');
            }
        });
    });

app.get('/search/:vars/:val', function(request,response){
  response.set('Content-Type', 'application/json');
	var val = request.params.val;
	return Listings.Listing.find({_id:val}, function (err, listing) {
	    if (!err){
	        response.status(200).send(JSON.stringify({
                listing: listing
            }));
	    } else {
	      response.status(404).send('{}');
	    }
	});
});

app.get('/listing/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
	var uid = request.params.uid;
	return Listing.Listing.find({_id:uid}, function (err, listing) {
	    if (!err){
	        response.status(200).send(JSON.stringify({
                listing: listing
            }));
	    } else {
            response.status(404).send('{}');
	    }
	});
});

if (ENV === DEV || ENV === STG) {
    app.delete('/listing/:uid', function(request,response){
        var uid = request.params.uid;
        return Listings.Listing.findOneAndRemove({_id:uid}, function (err, listing) {
            if (!err && listing) {
                response.sendStatus(204);
            } else {
                return response.status(500).send(error(
                    'UNKNOWN_SERVER_FAILURE',
                    err
                ));
            }
        });
    });
}

function purgeSession(response) {
    response.clearCookie('connect.sid');

}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// TODO: check up on this
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.listen(process.env.PORT || 80);

module.exports = app;
