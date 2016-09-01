// Service Wrappers
var geocoder = require('../wrappers/geocoder.js');

// Other Dependencies
var Consts = require('../consts.js');

// Listing Model Packages
var listing_model_path = '../models/listings/';
function pt(f) {
    return listing_model_path + f;
}
var listing = require(pt('listing.js'));
var misc_listing = require(pt('misc_listing.js'));
var book_listing = require(pt('book_listing.js'));
var sublet_listing = require(pt('sublet_listing.js'));
var furniture_listing = require(pt('furniture_listing.js'));
var listing_objs = [listing, misc_listing, book_listing, sublet_listing, furniture_listing];
var listing_name_map = {};
listing_objs.map(function(e, i) {
    listing_name_map[e.name] = e;
});

function getListingSchema(name) {
    return listing_objs[name].schema;
}

function getListingByIDAndUserID(listing_id, user_id, callback) {
    listing.model.findOne({_id: listing_id, user_id: user_id}, callback);
}
exports.getListingsByIDAndUserID = getListingsByIDAndUserID;

function getListingsByUserID(user_id, callback) {
    listing.model.find({user_id: user_id});
}
exports.getListingsByUserID = getListingsByUserID;

function makeNewListingFromPost(body, user_id, callback) {
    body.user_id = user_id;
    var paths = [];
    if ('type' in body and body.type in listing_name_map) {
        var sel_listing = listing_name_map[body.type];
        var listing = new sel_listing.model;
        var listing_schema = sel_listing.schema;
        for (var path in listing_schema.paths) {
            var first_period = path.indexOf('.');
            var real_path = path;
            if (first_period != -1) {
                real_path = path.substring(0, first_period);
            }
            if (paths.indexOf(real_path) == -1) {
                paths.push(real_path);
            }
        }
        Utils.copyObjectData(listing, body, paths);
        return updateListingLatLng(listing, function(result) {
            if (result) {
                return callback({
                    type: body.type,
                    listing: listing
                });
            } else {
                return callback(false);
            }
        });
    }
    return callback(false);
}

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

function updateMiscListingLatLng(listing, callback) {
    if (listing.kind != Listings.MISC) {
        return callback(false);
    } else if (typeof(listing.address) === typeof(void 0) || typeof(listing.address) != typeof('str') || listing.address.length == 0) {
        return callback(true);
    } else {
        geocoder.geocode(listing.address, function(err, res) {
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


