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

var WHITELIST = [
    [/^\/user\/\w+\/?$/i , ["GET"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/user\/\w+\/confirm\?[\w=&]+$/i, ["GET"], [Consts.ROLE_UNCONFIRMED_PUBLIC]],
    [/^\/user\/(([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?))\/recover$/i, ["POST"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/me\/password\/?$/i, ["PUT"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/me\/register\/?$/i, ["POST"], [Consts.ROLE_INVALID]],
    [/^\/me\/login\/?$/i, ["POST"], [Consts.ROLE_INVALID]],
    [/^\/me\/logout\/?$/i, ["POST"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/?$/i, ["GET", "POST"], [Consts.ROLE_INVALID, Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/?$/i, ["GET"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/flag\/?$/i, ["GET", "POST"], [Consts.ROLE_MODERATOR_PUBLIC, Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/approve\/?$/i, ["PUT"], [Consts.ROLE_MODERATOR_PUBLIC]],
    [/^\/listing\/\w+\/quarrentine\/?$/i, ["PUT"], [Consts.ROLE_MODERATOR_PUBLIC]],
    [/^\/listing\/\w+\/(?!approve|quarrentine)\/?$/i, ["PUT"], [Consts.ROLE_CONFIRMED_PUBLIC]],
];

//TODO: All test endpoints should require a high level role, and the
//      role can be assigned as simply a hard-coded cookie value in all requests
if (ENV === DEV || ENV === STG) {
    WHITELIST = WHITELIST.concat([
        [/^\/unconf_user\/[\w.@]+\/?$/, ["DELETE"], [Consts.ROLE_INVALID]],
        [/^\/user\/[\w.@]+\/?$/, ["DELETE"], [Consts.ROLE_INVALID]],
        [/^\/listing\/\w+\/?$/, ["DELETE"], [Consts.ROLE_INVALID]]
    ]);
}

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

exports.ensureEnv = function(request, response, next) {
    for (var i=0; i<WHITELIST.length; i++) {
        var line = WHITELIST[i];
        if (line[0].test(request.originalUrl)) {
            for (var j=0; j<line[1].length; j++) {
                if (request.method === line[1][j]) {
                    if (!line[2][j] ||
                        (ensureLoginSession(request) &&
                            Consts.checkPriv(request.session.login.who.role, line[2][j]))) {
                            return next();
                    }
                }
            }
            //TODO: more meaningful response here
        }
    }
    return response.status(403).send();
}

