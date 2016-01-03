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
var Listing = require('./models/listing.js');
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
app.use(cors());

// Session related plugins
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// Database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL|| 'mongodb://localhost/tusk';
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

app.get('/user/:id/confirm', function(request, response) {
    response.set('Content-Type', 'application/json');
    Unconf_User.findOne({_id: request.params.id}, function(err, user) {
        if (err) {
            return response.send(JSON.stringify({
                success: false,
                type: 'INVALID_USER_ID',
                message: 'Invalid user id'
            }));
        } else {
            if (request.query.key === user.confirmationKey) {
                user.remove();

                var newuser = new User;
                newuser.email = user.email;
                newuser.passwordHash = user.passwordHash;
                newuser.passwordSalt = user.passwordSalt;

                newuser.save(function (err) {
                    if (err) {
                        return response.send(JSON.stringify({
                            success: false,
                            type: 'DISK_SAVE_FAILURE',
                            message: err
                        }));
                    } else {
                        return response.send(JSON.stringify({
                            success: true,
                            message: 'Account email successfully verified'
                        }));
                    }
                });
            } else {
                return response.send(JSON.stringify({
                    success: false,
                    type: 'INVALID_CONFIRMATION_KEY',
                    message: 'The confirmation key provided was invalid'
                }));
            }
        }
    });
});

app.post('/user/register', function(request, response) {
    response.set('Content-Type', 'application/json');
    if (!Validate.checkForKeys(["email", "password", "confirmpass"], request.body)) {
        return response.send(JSON.stringify({
            success: false,
            type: 'MISSING_REGISTRATION_FIELD_FAILURE',
            message: "One or more of the registration fields was missing"
        }));
    } else {
        var email = Validate.normalizeEmail(request.body.email);
        if (!Validate.validateTuftsEmail(email)) {
            return response.send({
                success: false,
                type: 'TUFTS_EMAIL_VALIDATION_FAILURE',
                message: 'Email must be a tufts email'
            });
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
                    return response.send({
                        success: false,
                        type: 'EMAIL_IN_USE_FAILURE',
                        message: 'Email is already in use'
                    });
                }
                var password = request.body.password;
                if (password != request.body.confirmpass) {
                    return response.send({
                        success: false,
                        type: 'PASSWORD_MISMATCH_FAILURE',
                        message: "Passwords did not match"
                    });
                } else {
                    Unconf_User.findOne({email: email}, function(err, user) {
                        if (user) {
                            var now = (new Date()).getTime();
                            if (user.when.getTime() - now > 60000) {

                            } else {

                            }
                            Unconf_User.remove({email: email});
                        }
                        var newuser = new Unconf_User;

                        newuser.email = email;

                        var salt = bcrypt.genSaltSync(10);

                        newuser.passwordSalt = salt;
                        newuser.passwordHash = bcrypt.hashSync(password, salt);

                        confirmKey = Utils.md5(salt + email);

                        newuser.confirmationKey = confirmKey;

                        //TODO: Generate and send confirmation email
                        //      also create a new model for an unconfirmed user
                        
                        newuser.save(function(err) {
                            if (!err) {
                                return response.send(JSON.stringify({
                                    success: true,
                                    email: email,
                                    id: newuser._id,
                                    key: confirmKey
                                }));
                            } else {
                                return response.send(JSON.stringify({
                                    success: false,
                                    type: 'DISK_SAVE_FAILURE',
                                    message: err
                                }));
                            }
                        });
                    });
                }
            });
        }
    }
});

app.post('/user/logout', function(request, response) {
    response.set('Content-Type', 'application/json');
    console.log(request.session);
    if ('login' in request.session) {
        delete request.session;
        return response.send(JSON.stringify({success: true, message: 'Successfully logged out'}));
    }
    return response.send(JSON.stringify({
        success: false,
        type: 'LOGIN_SESSION_NOT_FOUND_FAILURE',
        message: 'Unsuccessfully logged out because not logged in'
    }));
});

app.delete('/unconf_user/:email', function(request, response) {
    response.set('Content-Type', 'application/json');
    Unconf_User.findOneAndRemove({email:Validate.normalizeEmail(request.params.email)}, function(err, resp) {
        if (err || !resp) {
            return response.send(JSON.stringify({success: false, message:err}));
        } else {
            return response.send(JSON.stringify({success: true, user:resp}));
        }
    });
});

// for debug only!!! not a real endpoint!
app.delete('/user/:email', function(request, response) {
    response.set('Content-Type', 'application/json');
    User.find({email:request.params.email}, function(err, user) {
        if (err || !user) {
            return reponse.send(JSON.stringify({success: false}));
        } else {
            User.findOneAndRemove({email:request.params.email}, function(err, resp) {
                if (err) {
                    return response.send(JSON.stringify({success: false, message:err}));
                } else {
                    return response.send(JSON.stringify({success: true, user:resp}));
                }
            });
        }
    });
});

app.post('/user/login', function(request, response) {
    response.set('Content-Type', 'application/json');
    if ("login" in request.session && "tries" in request.session.login) {
        var diff = Date.now() - request.session.login.when;
        if (diff > (3 * 60 * 1000))
            delete request.session.login;
        else if (request.session.login.tries > 5) {
            return response.send(JSON.stringify({success: false, message: "Too many login attempts. Wait a few minutes and try again."}));
        }
    }
    User.findOne({email:request.body.email}, function(err, user) {
        if (err) {
            reponse.send(JSON.stringify({success: false, message: err}));
        } else {
            if (user && bcrypt.hashSync(request.body.password, user.passwordSalt) === user.passwordHash) {
                request.session.login = {valid: true, when: Date.now()};
                return response.send(JSON.stringify({success: true, message: "Logged in successfully"}));
            } else {
                var t = (request.session.login != undefined && "tries" in request.session.login)?(request.session.login.tries+1):1;
                request.session.login = {valid: false, tries: t, when: Date.now()};
                return response.send(JSON.stringify({success: false, message: "Email/password combo was incorrect"}));
            }
        }
    });
});

app.get('/alive', function(request, response){
  return response.send('yes thank you');
});

app.route('/listing')
    .post(function(request, response) {
        response.set('Content-Type', 'application/json');
        var listing = new Listing;
        listing.user_id = 0;
        listing.address = request.body.address;
        listing.date_range = request.body.date_range;
        listing.rent = request.body.rent;
        listing.bedrooms_available = request.body.bedrooms;
        listing.bathrooms = request.body.bathrooms;
        listing.image_gallery_link = ('image_gallery_link' in request.body) ? request.body.image_gallery_link : "";
        listing.est_utilities = ('est_utilities' in request.body) ? request.body.est_utilities : "";
        listing.notes = ('notes' in request.body) ? request.body.notes : "";


        listing.save(function(err){
            if (!err) {
                return response.send(JSON.stringify({success: true, rsc_id: listing._id}));
            } else {
                return response.send(JSON.stringify({success: false, message:err}));
            }
        });
    })
    .get(function(request,response){
      response.set('Content-Type', 'application/json');
         return Listing.find(function (err, listings) {
            if (!err){
              return response.send(listings.reverse());
            } else {
              return response.send('{}');
            }
        });
    });

app.get('/search/:vars/:val', function(request,response){
  response.set('Content-Type', 'application/json');
	var val = request.params.val;
	return Listing.find({_id:val}, function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send('{}');
	    }
	});
});

app.get('/listing/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
	var uid = request.params.uid;
	return Listing.find({_id:uid}, function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send('{}');
	    }
	});
});

app.delete('/listing/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
	var uid = request.params.uid;
	return Listing.findOneAndRemove({_id:uid}).remove(function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send(err);
	    }
	});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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

app.listen(process.env.PORT || 3000);

module.exports = app;
