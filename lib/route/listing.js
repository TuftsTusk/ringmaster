// load Schema
var Listings = require('../models/listing.js');

// Tusk Libraries
var Validate = require('../validation.js');
var Utils = require('../utils.js');
var Consts = require('../consts.js');
var Common = require('../common.js');

// Listing Endpoints

function makeNewListingFromPost(body, user_id) {
    if (body.type) {
        if (body.type === Listings.MISC) {
            var miscListing = new Listings.MiscListing;
            miscListing.title = body.title;
            miscListing.description = body.description;
            miscListing.user_id = user_id;
            miscListing.price = body.price;
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

    if (!Common.ensureLoginSession(request)) {
        return response.status(400).send(Common.error(
            'NOT_LOGGED_IN_EXCEPTION',
            'Listing could not be posted because the user is not logged in'
        ));
    }
    
    var newListing = makeNewListingFromPost(request.body, request.session.login.who.id);
    if (!newListing) {
        return response.status(400).send(Common.error(
            'LISTING_INVALID_DATA_EXCEPTION',
            'Listing data did not contain all requisite fields'
        ));
    } else {
        newListing.listing.save(function (err) {
            if (!err) {
                return response
                        .status(201)
                        .set('Location', '/listing/'+newListing.listing._id)
                        .send({rsc_id: newListing.listing._id});
            } else {
                return response.status(500).send(Common.error('DISK_SAVE_FAILURE', err));
            }
        });
    }
}

exports.getListingByUserId = function(request, response) {
    response.set('Content-Type', 'application/json');
    
    Listings.Listing
        .find({user_id: request.params.user_id})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify(listings));
        }
    });
}

exports.getListingByUserIdByFilter = function(request, response) {
    response.set('Content-Type', 'application/json');
    
    var filters = parseFilters(request.params.filter);
    filters.user_id = request.params.user_id;

    Listings.Listing
        .find(filters)
        .sort({createdAt: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify(listings));
        }
    });
}

function getListingHistoryById(user_id, filters) {
    response.set('Content-Type', 'application/json');
    
    Listings.Listing
        .find({user_id: request.params.user_id})
        .sort({createdAt: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify(listings));
        }
    });
}

function parseFilters(filter_str) {
    var filters = JSON.parse(decodeURI(filter_str));
    return {};
}

exports.getMeListingByFilter = function(request, response) {
    response.set('Content-Type', 'application/json');
    var filters = parseFilters(request.params.filter);
    return response.status(200).send(getListingHistoryById(request.params.uid, filters));
}

exports.getMeListing = function(request, response) {
    response.set('Content-Type', 'application/json');
    
    return response.status(200).send(getListingHistoryById(request.params.uid, []));
}

exports.getListingHistoryById = function(request, response) {
    response.set('Content-Type', 'application/json');
    return response.sendStatus(500);
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
    var uid = request.params.listing_id;
    return Listings.Listing.findOne({_id:uid}, function (err, listing) {
        if (!err){
            response.status(200).send(JSON.stringify({
                listing: listing
            }));
        } else {
            response.status(404).send('{}');
        }
    });
}

exports.putListingAttributeById = function(request, response) {
    response.set('Content-Type', 'application/json');
    if (!Common.ensureLoginSession(request)) {
        return response.status(400).send(Common.error(
            'NOT_LOGGED_IN_EXCEPTION',
            'Listing could not be posted because the user is not logged in'
        ));
    }
    var uid = request.params.listing_id;
    var attr = request.params.listing_attr;
    Listings.Listing.findOne({_id:uid}, function(err, listing) {
        if (!err) {
            if (!(attr in listing)) {
                return response.status(400).send(Common.error(
                    'INVALID_REQUEST_ATTRIBUTE_FAILURE',
                    'The listing attribute could not be changed'
                ));
            } else {
                //TODO: remember to add validation middleware functions for mongoose
                //schemata because PUT calls will need to have their data validated every time
                //which will be easy to forget and complicate
                if (typeof(listing.attr) === typeof({})) {
                    if (listing.attr === "approval") {
                        listing.approval.approved = request.body.toLowerCase() === 'true';
                        listing.approval.approved_by = request.session.login.who.id;
                    }
                } else
                    listing.attr = request.body;
                listing.save(function(err) {
                    if (!err) return response.sendStatus(204);
                    return response.status(500).send(Common.error('DISK_SAVE_FAILURE', err));
                });
            }
        } else {
            return response.status(400).send(Common.error(
                'LISTING_NOT_FOUND_FAILURE',
                'The requested listing was not found'
            ));
        }
    });
}
