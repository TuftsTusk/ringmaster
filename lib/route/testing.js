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
var Validate = require('../validation.js');
var Utils = require('../utils.js');
var Consts = require('../consts.js');
var ENV = Consts.ENV;
var UNDEF = Consts.UNDEF;
var UNKWN = Consts.UNKWN;
var DEV = Consts.DEV;
var STG = Consts.STG;
var PROD = Consts.PROD;

var WHITELIST = [
    [/^\/user\/\w+\/?$/i , ["GET"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/user\/\w+\/confirm\?[\w=&]+$/i, ["GET"], [Consts.ROLE_INVALID]],
    [/^\/user\/(([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?))\/recover$/i, ["POST"], [Consts.ROLE_INVALID]],
    [/^\/me\/password\/?$/i, ["PUT"], [Consts.ROLE_INVALID]],
    [/^\/me\/register\/?$/i, ["POST"], [Consts.ROLE_INVALID]],
    [/^\/me\/login\/?$/i, ["POST"], [Consts.ROLE_INVALID]],
    [/^\/me\/logout\/?$/i, ["POST"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/me\/listing\/?$/i, ["GET"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/me\/listing\/filter\/\w+\/?$/i, ["GET"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/?$/i, ["GET", "POST"], [Consts.ROLE_INVALID, Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/?$/i, ["GET"], [Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/flag\/?$/i, ["GET", "POST"], [Consts.ROLE_MODERATOR_PUBLIC, Consts.ROLE_CONFIRMED_PUBLIC]],
    [/^\/listing\/\w+\/approve\/?$/i, ["PUT"], [Consts.ROLE_MODERATOR_PUBLIC]],
    [/^\/listing\/\w+\/quarrentine\/?$/i, ["PUT"], [Consts.ROLE_MODERATOR_PUBLIC]],
    //[/^\/listing\/\w+\/(?!approve|quarrentine)\/?$/i, ["PUT"], [Consts.ROLE_CONFIRMED_PUBLIC]],
];

var DEV_WHITELIST = [
    [/^\/unconf_user\/[\w.@]+\/?$/, ["DELETE"], [Consts.ROLE_ROOT]],
    [/^\/user\/[\w.@]+\/?$/, ["DELETE"], [Consts.ROLE_ROOT]],
    [/^\/listing\/\w+\/?$/, ["DELETE"], [Consts.ROLE_ROOT]]
];

//TODO: All test endpoints should require a high level role, and the
//      role can be assigned as simply a hard-coded cookie value in all requests
/*
if (ENV === DEV || ENV === STG) {
    WHITELIST = WHITELIST.concat(DEV_WHITELIST);
}
*/

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

function hasUrlPermission(url, method, user_roles) {
    return hasUrlPermissionByWhitelist(url, method, user_roles, ENV === DEV || ENV === STG ? WHITELIST.concat(DEV_WHITELIST) : WHITELIST);
}

function hasProdUrlPermission(url, method, user_roles) {
    return hasUrlPermissionByWhitelist(url, method, user_roles, WHITELIST);
}

function hasUrlPermissionByWhitelist(url, method, user_roles, whitelist) {
    for (var i=0; i<whitelist.length; i++) {
        var line = whitelist[i];
        if (line[0].test(url)) {
            for (var j=0; j<line[1].length; j++) {
                if (method === line[1][j] && Consts.checkPriv(user_roles, line[2][j])) {
                    return true;
                }
            }
        }
    }
    return false;
}

exports.WHITELIST = WHITELIST;
exports.DEV_WHITELIST = DEV_WHITELIST;

exports.hasUrlPermission = hasUrlPermission;
exports.hasProdUrlPermission = hasProdUrlPermission;
exports.ensureEnv = function(request, response, next) {
    if (hasUrlPermission(request.originalUrl,
        request.method,
        getRoles(request))) {
        return next();
    }
    return response.status(403).send();
}

function getRoles(request) {
    if (env === DEV || env === STG) {
        for (var i=0; i<DEV_WHITELIST; i++) {
            var wl = DEV_WHITELIST[i];
            if (wl[0].test(request.originalUrl)) {
                for (var j=0; j<wl[1].length; j++) {
                    if (wl[1][j] === request.method) {
                        return wl[2][j];
                    }
                }
            }
        }
    }
    if (ensureLoginSession(request)) {
        return request.session.login.who.role;
    }
    return Consts.ROLE_INVALID;
}

