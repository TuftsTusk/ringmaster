// Handlers
var listingHandler = require('../handlers/listing.js');

// Tusk Libraries
var Validate = require('../validation.js');
var Utils = require('../utils.js');
var Consts = require('../consts.js');
var Common = require('../common.js');

var User = require('../models/user.js')
var email = require('../email.js')


// Listing Endpoints
exports.postListing = function(request, response) {
    response.set('Content-Type', 'application/json');
    if (!Common.ensureLoginSession(request)) {
        return response.status(400).send(Common.error(
            'NOT_LOGGED_IN_EXCEPTION',
            'Listing could not be posted because the user is not logged in'
        ));
    }
    listingHandler.makeNewListingFromPost(request.body, request.session.login.who.id, function(newListing) {
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
    listingHandler.findListingByIDAndUserID(listing_id, request.session.login.who.id, function(err, listing) {
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
                if (!(key in listingHandler.getListingSchema(request.body.type).paths)) {
                    return response.status(400).send(Common.error(
                        'INVALID_LISTING_PATH_FAILURE',
                        'Listing to be updated contained invalid data'
                    ));
                }
                Utils.setValueByPath(listing, key, request.body[key]);
            }
            if ('apt_info.address' in request.body) {
                listingHandler.updateSubletListingLatLng(listing, function(success) {
                    if (success) {
                        listing.save(function(err) {
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

function secureListings(request, listings, include_id) {
    return listings.map(function(e) {
        return secureListing(request, e, include_id);
    }).filter(function(e) {
        //
    });
}

function secureListing(request, listing, include_id) {
    if ("toSecure" in listing && (typeof(listing.toSecure) === typeof(secureListing))) {
        if (Common.ensureLoginSession(request)) {
            return listing.toSecure(request.session.login.who.role, request.session.login.who.id, include_id);
        } else
            return listing.toSecure(Consts.ROLE_INVALID, include_id);
    } else if (Common.ensureLoginSession(request)) {
        //TODO: warn and log this case... should NEVER happen!
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

    listingHandler.getListingByUserID(request.params.user_id, function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing by user id request'));
        } else {
            return response.status(200).send(JSON.stringify(secureListings(request, listings, true)));
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
            return response.status(200).send(JSON.stringify(secureListings(request, listings, true)));
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
          var secure_wrapped_listings = listings.map(function(elem) {
              return {
                  listing: secureListing(request, elem, true)
              };
          });
          return response.status(200).send(JSON.stringify(secure_wrapped_listings));
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
    if ("type" in request.query) {
      params.type = request.query.type;
    }
    return Listings.Listing
        .find(params)
        .or([{"apt_info.address": new RegExp(request.query.search, 'i')}, { 'title': { $regex: new RegExp(request.query.search, 'i' )}}])
        .sort({lastRefreshed: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(function(err, listings) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing request'));
        } else {
            var secure_wrapped_listings = listings.map(function(elem) {
                return {
                    listing: secureListing(request, elem, true),
                    owner: 'user_id' in elem && Common.ensureLoginSession(request) && elem.user_id == request.session.login.who.id
                };
            });
            return response.status(200).send(JSON.stringify(secure_wrapped_listings));
        }
    });
}

exports.contactListingSeller = function(request, response) {
    var uid = request.params.listing_id;
    var message = request.body.message;
    var params = {_id:uid};
    if (!message){
        return response.status(400).send(Common.error('Invalid message contents to send message'));
    }
    return Listings.Listing
        .findOne(params)
        .exec(function(err, listing) {
        if (err) {
            return response.status(400).send(Common.error('Invalid listing to send message'));
        } else {
            if (!listing)
                return response.status(400).send(Common.error('Invalid listing'));
            var user_id = listing.user_id;
            var params = {_id:user_id};
            return User.findOne(params)
                .exec(function(err, user){
                    email.contactSeller(request.session.login.who.email, user.email, message, function(error){
                      if (error){
                        return response.status(400).send(Common.error('Contact seller failure', error));
                      }
                      else {
                        return response.sendStatus(204);
                      }
                })
            })
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
            if (!listing)
                return response.status(400).send(Common.error('Invalid listing'));
            return response.status(200).send(JSON.stringify({
                listing: secureListing(request, listing, true),
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

exports.putListingVisibilityById = function(request, response) {
    response.set('Content-Type', 'application/json');
    if (!Common.ensureLoginSession(request)) {
        return response.status(400).send(Common.error(
            'NOT_LOGGED_IN_EXCEPTION',
            'Listing could not be posted because the user is not logged in'
        ));
    }
    var uid = request.params.listing_id;
    var visible = request.params.visible;

}

