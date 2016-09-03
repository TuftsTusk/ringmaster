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
    return listing_objs[name].schema;
}

function getListingByID(listing_id, callback) {
    listing.model.findOne({_id: listing_id}, callback);
}
exports.getListingByID = getListingByID;

function getListingsByUserID(user_id, callback) {
    listing.model.find({user_id: user_id});
}
exports.getListingsByUserID = getListingsByUserID;

function getListingsBySearch(search_query, type, callback) {
    var params = {
        'type': type
    };
    listing.model
        .find(params)
        .or([{"geotag.address": new RegExp(search_query, 'i')}, { 'title': new RegExp(search_query, 'i' )}])
        .sort({lastRefreshed: 'desc'})
        .limit(Consts.MAX_LISTING_RESULTS)
        .exec(callback);
}
exports.getListingsBySearch = getListingsBySearch;

function makeNewListingFromPost(body, user_id, callback) {
    console.log("Making a post with stuff" +user_id);
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
        console.log(listing);
        Utils.copyObjectData(listing, body, paths);
        console.log(listing);
        getGeotag(listing.geotag.address, function(geotag) {
            console.log(geotag);
            if (!geotag) {
                return callback({
                    type: body.type,
                    listing: listing
                });
            } else {
                listing.geotag = geotag;
                return callback({
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

function getGeotag(address, callback) {
    console.log('Geocoding '+address);
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

