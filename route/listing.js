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

// Listing Endpoints

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

exports.postListing = function(request, response) {
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
}

exports.getListing = function(request, response) {
    response.set('Content-Type', 'application/json');
     return Listings.Listing.find(function (err, listings) {
        if (!err){
          return response.status(200).send(listings.reverse());
        } else {
          return response.status(404).send('{}');
        }
    });
}

exports.getListingById = function(request, response) {
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
}

