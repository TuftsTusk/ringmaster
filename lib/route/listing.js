// load Schema
var Listings = require('../models/listing.js');

// Tusk Libraries
var Validate = require('../validation.js');
var Utils = require('../utils.js');
var Consts = require('../consts.js');
var Common = require('../common.js');

/*
var geocoderProvider = 'google';
var httpAdapter = 'http';
// optional
var extra = {
    apiKey: 'AIzaSyAOBTvP_YccSD8if2yHmyiDMxgulGUXxoY', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

geocoder.geocode('30 Adams St., Medford MA 02155', function(err, res) {
    console.log(res);
});
*/
// Listing Endpoints

function makeNewListingFromPost(body, user_id) {
    body.user_id = user_id;
    if (body.type) {
        if (body.type === Listings.MISC) {
            var miscListing = new Listings.MiscListing;
            for (var path in Listings._MiscSchema.paths) {
                if (path in body) {
                    miscListing[path] = body[path];
                }
            }
            return {
                type: body.type,
                listing: miscListing
            };
        } else if (body.type === Listings.SUBLET) {
            var subletListing = new Listings.SubletListing;
            paths = [];
            for (var path in Listings._SubletSchema.paths) {
                var first_period = path.indexOf('.');
                var real_path = path;
                if (first_period != -1) {
                    real_path = path.substring(0, first_period);
                }
                if (paths.indexOf(real_path) == -1) {
                    paths.push(real_path);
                }
            }
            Utils.copyObjectData(subletListing, body, paths);
            return {
                type: body.type,
                listing: subletListing
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
                return response.status(400).send(Common.error(
                    'LISTING_DATA_VALIDATION_FAILURE_EXCEPTION',
                    'Listing data failed to validate'
                ));
            }
        });
    }
}

function secureListings(request, listings) {
    return listings.map(function(e) {
        return secureListing(request, e);
    });
}

function secureListing(request, listing) {
    if ("toSecure" in listing && (typeof(listing.toSecure) === typeof(secureListing))) {
        return listing.toSecure();
    } else if (Common.ensureLoginSession(request)) {
        if (Consts.checkPriv(request.session.who.role, Consts.ROLE_ADMIN)) {
            return listing;
        } else if (Consts.checkPriv(request.session.who.role, Consts.ROLE_MODERATOR_PUBLIC)
            && request.session.who.role & Consts.extractMask(listing.role_mask)) {
            return listing;
        }
    }
    return {};
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
            return response.status(200).send(JSON.stringify(secureListings(request, listings)));
        }
    });
}

exports.getListingByUserIdByFilter = function(request, response) {
    response.set('Content-Type', 'application/json');
    
    filters.user_id = request.params.user_id;

    Listings.Listing
        .find(filters)
        .sort({createdAt: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify(secureListings(request, listings)));
        }
    });
}

function getListingHistoryById(user_id, filters) {
    response.set('Content-Type', 'application/json');
    
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
    return Listings.Listing
        .find(params)
        .sort({createdAt: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify(secureListings(request, listings)));
        }
    });
}

exports.getListingById = function(request, response) {
    response.set('Content-Type', 'application/json');
    var uid = request.params.listing_id;
    var params = {_id:uid};
    return Listings.Listing
        .findOne(params)
        .exec(function(err, listing) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify({
                listing: secureListing(request, listing),
                owner: listing.user_id === request.session.login.who.id
            }));
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
                    return response.status(400).send(Common.error(
                        'LISTING_DATA_VALIDATION_FAILURE_EXCEPTION',
                        'Listing data failed to validate'
                    ));
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

