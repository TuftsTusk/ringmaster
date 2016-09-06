// Service Wrappers
var geocoder = require('../wrappers/geocoder.js');

// Other Dependencies
var Consts = require('../consts.js');
var Utils = require('../utils.js');

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
    return listing_name_map[name].schema;
}
exports.getListingSchema = getListingSchema;

function getListingByID(listing_id, callback) {
    var params = {
        '_id': listing_id,
        'integrity.flag': false
    };
    listing.model.findOne(params, callback);
}
exports.getListingByID = getListingByID;

function getListingsByUserID(user_id, callback) {
    var params = {
        'user_id': user_id,
        'integrity.flag': false
    };
    listing.model.find(params, callback);
}
exports.getListingsByUserID = getListingsByUserID;

function getListings(listing_type, callback) {
    var params = {
        'integrity.visible': true,
        'integrity.flag': false
    };
    if (listing_type != null) {
        params['type'] = listing_type;
    }
    listing.model
        .find(params)
        .sort({lastRefreshed: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(callback);
}
exports.getListings = getListings;

function getListingsBySearch(search_query, listing_type, callback) {
    var params = {
        'integrity.visible': true,
        'integrity.flag': false
    };
    if (listing_type != null) {
        params['type'] = listing_type;
    }
    listing.model
        .find(params)
        .or([{"geotag.address": new RegExp(search_query, 'i')}, { 'title': new RegExp(search_query, 'i' )}])
        .sort({lastRefreshed: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(callback);
}
exports.getListingsBySearch = getListingsBySearch;

function makeNewListingFromPost(body, user_id, callback) {
    body.user_id = user_id;
    var paths = [];
    if ('type' in body && body.type in listing_name_map) {
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
        getGeotag(listing.geotag.address, function(geotag) {
            if (!geotag) {
                return callback({
                    geotag: false,
                    type: body.type,
                    listing: listing
                });
            } else {
                return callback({
                    geotag: geotag,
                    type: body.type,
                    listing: listing
                });
            }
        });
    } else {
        return callback(false);
    }
}
exports.makeNewListingFromPost = makeNewListingFromPost;

function isAddressRequired(compl_listing) {
    return 'address_required' in compl_listing &&
                compl_listing.address_required;
}
function isListingReady(compl_listing) {
    return !(!compl_listing || (isAddressRequired(compl_listing) && !compl_listing.geotag));
}
exports.isListingReady = isListingReady;

function getGeotag(address, callback) {
    geocoder.geocode(address, function(err, res) {
        if (!Array.isArray(res)) {
            return callback(false);
        }
        switch(res.length) {
            case 0:
                return callback(false);
            case 1:
                var lat = res[0].latitude;
                var lng = res[0].longitude;
                return callback({
                    'lat': lat,
                    'lng': lng,
                    'address': address
                });
            default:
                console.log("Unexpected number of geocode results for "+new_address);
                console.log(res);
                return callback(false);
        }
    });
}
