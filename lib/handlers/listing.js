// Service Wrappers
var geocoder = require('../wrappers/geocoder.js');

// Other Dependencies
var Consts = require('../consts.js');
var Common = require('../common.js');
var Utils = require('../utils.js');
var uuid = require('uuid');

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

function saveResultBuffer(request, results, search_id) {
    if (request.session == undefined) return;
    if (!('history' in request.session)) {
        request.session.history = {};
    }
    request.session.history[search_id] = {
        results: results,
        when: Date.now(),
        who: (Common.ensureLoginSession(request) ? request.session.login.who.id : -1)
    };
}

function saveAndReturnListings(request, listings, s_id, callback) {
    request.session.save(function(err) {
        var ret = {
            listings: listings,
            search_id: s_id
        }
        callback(false, ret);
    });
}

function getSavedSearch(request, search_id) {
    if (request.session && search_id in request.session.history) {
        return request.session.history[search_id];
    } else {
        return false;
    }
}

function getListings(request, callback) {
    var query = request.query;
    var listings = []
    var s_id = '';
    if ('search_id' in query) {
        s_id = query.search_id;
        var c_session = getSavedSearch(request, s_id);
        if (!c_session) {
            return callback('The search session was not found.');
        } else {
            for (var i=0; i<Consts.PAGE_SIZE; i++) {
                listings.push(c_session.results.pop(0));
            }
            saveAndReturnListings(request, listings, s_id, callback);
        }
    } else {
        var params = {
            'integrity.visible': true,
            'integrity.flag': false
        };
        if ('type' in query) {
            params['type'] = query.type;
        }
        
        if ('query' in query) {
            params['geotag.address'] = new RegExp(query.query, 'i')
            params['title'] = new RegExp(query.query, 'i' )
        }
        s_id = uuid.v4();
        listing.model
            .find(params)
            .sort({lastRefreshed: 'desc'})
            .limit(Consts.MAX_LISTING_RESULTS)
            .exec(function(err, results) {
            for (var i=0; i<Consts.PAGE_SIZE; i++) {
                listings.push(results.pop(0));
            }
            saveResultBuffer(request, results, s_id);
            saveAndReturnListings(request, listings, s_id, callback);
        });
    }
}
exports.getListings = getListings;

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

