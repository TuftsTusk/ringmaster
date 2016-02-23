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
validator = require('validator'),
bcrypt = require('bcrypt-nodejs'),
mailer = require('nodemailer');

// load Schema
var Listings = require('../models/listing.js');
var Unconf_User = require('../models/unconf_user.js');
var User = require('../models/user.js');

// Tusk Libraries
var Validate = require('../lib/validation.js');
var Utils = require('../lib/utils.js');
var Consts = require('../lib/consts.js');
var ENV = Consts.ENV;
var UNDEF = Consts.UNDEF;
var UNKWN = Consts.UNKWN;
var DEV = Consts.DEV;
var STG = Consts.STG;
var PROD = Consts.PROD;


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


// User Account Endpoints

exports.getUserById = function(request, response) {

}

exports.getUserConfirmById = function(request, response) {
    Unconf_User.findOne({_id: request.params.id}, function(err, user) {
        if (err || !user) {
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
                
                newuser.role = Consts.ROLE_CONFIRMED_TUFTS;

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
}

exports.putMyPassword = function(request, response) {
    var pass_change = ((!request.session.login || !request.session.login.valid)
                        && Validate.checkForKeys(["user_id", "confirm_key"], request.body));
    
    var targetid = pass_change ? request.body.user_id : request.session.login.who.id;
    if (targetid == null)
        return response.status(400).send(error('NOT_LOGGED_IN_FAILURE', 'User not logged in'));

    if (!Validate.checkForKeys(["password", "confirmpass"], request.body) ||
            typeof request.body.password !== "string") {
        return response.status(400).send(error(
            'MISSTING_PARAM_FAILURE',
            'Parameter was missing from the request'
        ));
    }

    if (request.body.password != request.body.confirmpass) {
        return response.status(400).send(error(
            'PASSWORD_MISMATCH_FAILURE',
            'Passwords did not match'
        ));
    }


    User.findOne({_id: targetid}, function(err, user) {
        if (err) {
            return response.status(500).send(error(
                'DISK_SAVE_FAILURE',
                err 
            ));
        } else if (!user) {
            return response.status(500).send(error(
                'UNKNOWN_FAILURE',
                'An unknown failure occured' 
            ));
        } else {
            if (pass_change) {
                if (!user.recovery.requested)
                    return response.status(500).send(error(
                        'RECOVERY_NOT_REQUESTED_FAILURE',
                        'Password change request was not on file'
                    ));
                else if (user.recovery.key != request.body.confirm_key)
                    return response.status(400).send(error(
                        'INVALID_CONFIRMATION_KEY_FAILURE',
                        'The confirmation key used to change the password was invalid'
                    ));
                else if ((Date.now() - user.recovery.when) > Consts.MAX_RECOVERY_KEY_AGE)
                    return response.status(400).send(error(
                        'CONFIRMATION_KEY_EXPIRATION_FAILURE',
                        'The confirmation key used to change the password has already expired'
                    ));
                user.recovery.requested = false;
            }

            var salt = bcrypt.genSaltSync(10);
            user.passwordHash = bcrypt.hashSync(request.body.password, salt);
            user.passwordSalt = salt;
            user.save(function (err) {
                if (err) {
                    return response.status(500).send(error(
                        'DISK_SAVE_FAILURE',
                        err 
                    ));
                }
                return response.sendStatus(204);
            });
        }
    });
}

exports.postUserRecoverByEmail = function(request, response) {
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
        
        user.save(function(err) {
            if (err) {
                return response.status(500).send(error(
                    'DISK_SAVE_FAILURE',
                    err 
                ));
            }
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
}

exports.postMeRegister = function(request, response) {
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
}

exports.postMeLogin = function(request, response) {
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
                    email: user.email,
                    role: user.role
                }
            };
            return response.status(204).send();
        } else {
            var t = (request.session.login != undefined && "tries" in request.session.login)?(request.session.login.tries+1):1;
            request.session.login = {valid: false, tries: t, when: Date.now()};
            return response.status(400).send(JSON.stringify({message: "Email/password combo was incorrect"}));
        }
    });
}

exports.postMeLogout = function(request, response) {
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
}

exports.getMeListing = function(request, response) {
    request.params = {
        filter: ""
    };
    return exports.getMeListingByFilter(request, response);
}

exports.getMeListingByFilter = function(request, response) {
    if (!request.session.login || !request.session.login.valid) {
        return response.status(400).send(error('NOT_LOGGED_IN_FAILURE', 'User not logged in'));
    } else {
        //TODO: validate the filter
        Listings.Listing.find({user_id: request.session.login.who.id}, function(listings, err) {
            if (err) return response.status(500).send(error('LISTING_LOOKUP_FAILURE', 'Listings for the current user could not be found'));
            else return response.status(200).send(JSON.stringify(err));
        });
    }

}

