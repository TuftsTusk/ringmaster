// load Schema
var Listings = require('../models/listing.js');

// Tusk Libraries
var Validate = require('../validation.js');
var Utils = require('../utils.js');
var Consts = require('../consts.js');
var Common = require('../common.js');


var geocoderProvider = 'google';
var httpAdapter = 'https';
// optional
var extra = {
    apiKey: 'AIzaSyDE8UDnsYQftCEkjt_k1WuooAez9BsPWCM', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

// Listing Endpoints

function updateSubletListingLatLng(listing, callback) {
    if (listing.kind != Listings.SUBLET || typeof(listing.apt_info.address) === typeof(void 0)) {
        return callback(false);
    } else {
        geocoder.geocode(listing.apt_info.address, function(err, res) {
            if (!Array.isArray(res)) {
                return callback(false);
            }
            switch(res.length) {
                case 0:
                    return callback(false);
                case 1:
                    var lat = res[0].latitude;
                    var lng = res[0].longitude;
                    listing.apt_info.lat = lat;
                    listing.apt_info.lng = lng;
                    return callback(true);
                default:
                    console.log("Unexpected number of geocode results for "+new_address);
                    console.log(res);
                    return callback(false);
            }
        });
    }
}

function makeNewListingFromPost(body, user_id, callback) {
    body.user_id = user_id;
    if ('type' in body) {
        if (body.type === Listings.MISC) {
            var miscListing = new Listings.MiscListing;
            for (var path in Listings._MiscSchema.paths) {
                if (path in body) {
                    miscListing[path] = body[path];
                }
            }
            return callback({
                type: body.type,
                listing: miscListing
            });
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
            updateSubletListingLatLng(subletListing, function(result) {
                if (result) {
                    callback({
                        type: body.type,
                        listing: subletListing
                    });
                } else {
                    return callback(false);
                }
            });
        }
    } else
        return callback(false);
}

exports.postListing = function(request, response) {
    response.set('Content-Type', 'application/json');
    if (!Common.ensureLoginSession(request)) {
        return response.status(400).send(Common.error(
            'NOT_LOGGED_IN_EXCEPTION',
            'Listing could not be posted because the user is not logged in'
        ));
    }
    makeNewListingFromPost(request.body, request.session.login.who.id, function(newListing) {
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
    });
}

exports.postListingById = function(request, response) {
    response.set('Content-Type', 'application/json');

    if (!Common.ensureLoginSession(request)) {
        return response.status(400).send(Common.error(
            'NOT_LOGGED_IN_EXCEPTION',
            'Listing could not be posted because the user is not logged in'
        ));
    }

    var listing_id = request.params.listing_id;
    Listings.Listing.findOne({_id: listing_id, user_id: request.session.who.id}, function(err, listing) {
        if (err || !listing) {
            return response.sendStatus(404);
        } else {
            if (!'type' in request.body) {
                return response.status(400).send(Common.error(
                    'TYPE_NOT_DEFINED_FAILURE',
                    'Listing to be updated did not carry a listing type'
                ));
            }
            for (var key in request.body) {
                if (!(key in Listings[request.body.type].schema.paths)) {
                    return response.status(400).send(Common.error(
                        'INVALID_LISTING_PATH_FAILURE',
                        'Listing to be updated did not carry a listing type'
                    ));
                }
                Utils.setValueByPath(listing, key, request.body[key]);
            }
            if ('apt_info.address' in request.body) {
                updateSubletListingLatLng(listing, function(success) {
                    if (success) {
                        listing.listing.save(function(err) {
                            if (err) return response.status(400).send(Common.error(
                                'LISTING_DATA_VALIDATION_FAILURE_EXCEPTION',
                                'Listing data failed to validate'
                            ));
                            return response.sendStatus(204);
                        });
                    } else {
                        return response.status(400).send(Common.error(
                            'LISTING_DATA_VALIDATION_FAILURE_EXCEPTION',
                            'Listing data failed to validate'
                        ));
                    }
                });
            } else {
                listing.save(function(err) {
                    if (err) return response.status(400).send(Common.error(
                        'LISTING_DATA_VALIDATION_FAILURE_EXCEPTION',
                        'Listing data failed to validate'
                    ));
                    return response.sendStatus(204);
                });
            }
        }
    });
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
        .sort({lastRefreshed: 'desc'})
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
    if (!Common.ensureLoginSession(request)) {
        return response.status(400).send(Common.error(
            'NOT_LOGGED_IN_EXCEPTION',
            'Listing could not be posted because the user is not logged in'
        ));
    }
    var params = {user_id:request.session.login.who.id};
    return Listings.Listing
        .find(params)
        .sort({lastRefreshed: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify(secureListings(request, listings)));
        }
    });
}

exports.getListingHistoryById = function(request, response) {
    response.set('Content-Type', 'application/json');
    return response.sendStatus(500);
}

exports.getListing = function(request, response) {
    response.set('Content-Type', 'application/json');
    var params = {};
    if ("type" in request.query)
        params.type = request.query.type;
    return Listings.Listing
        .find(params)
        .sort({lastRefreshed: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            var secure_wrapped_listings = listings.map(function(elem) {
                return {
                    listing: secureListing(request, elem),
                    owner: 'user_id' in elem && Common.ensureLoginSession(request) && elem.user_id == request.session.login.who.id
                };
            });
            return response.status(200).send(JSON.stringify(secure_wrapped_listings));
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
            var listing = secureListing(request, listing);
            if (!listing)
                return response.status(400).send(Common.error('Invalid listing'));
            return response.status(200).send(JSON.stringify({
                listing: listing,
                owner: 'user_id' in listing && listing.user_id === request.session.login.who.id
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

