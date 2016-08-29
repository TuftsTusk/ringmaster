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

function makeNewListingFromPost(body, user_id, callback) {
    body.user_id = user_id;
    var paths = [];
    if ('type' in body) {
        if (body.type === misc_listing.name) {
            var miscListing = new Listings.MiscListing;
            for (var path in Listings._MiscSchema.paths) {
                var first_period = path.indexOf('.');
                var real_path = path;
                if (first_period != -1) {
                    real_path = path.substring(0, first_period);
                }
                if (paths.indexOf(real_path) == -1) {
                    paths.push(real_path);
                }
            }
            Utils.copyObjectData(miscListing, body, paths);
            return updateMiscListingLatLng(miscListing, function(result) {
                if (result) {
                    return callback({
                        type: body.type,
                        listing: miscListing
                    });
                } else {
                    return callback(false);
                }
            });
        } else if (body.type === sublet_listing.name) {
            var subletListing = new Listings.SubletListing;
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
            return updateSubletListingLatLng(subletListing, function(result) {
                if (result) {
                    callback({
                        type: body.type,
                        listing: subletListing
                    });
                } else {
                    return callback(false);
                }
            });
        } else if (body.type === sublet_listing.name) {
            var bookListing = new Listings.BookListing;
            for (var path in Listings._BookSchema.paths) {
                var first_period = path.indexOf('.');
                var real_path = path;
                if (first_period != -1) {
                    real_path = path.substring(0, first_period);
                }
                if (paths.indexOf(real_path) == -1) {
                    paths.push(real_path);
                }
            }
            Utils.copyObjectData(bookListing, body, paths);
            return callback({
                type: body.type,
                listing: bookListing
            });
        } else if (book.type === book_listing.name) {

        }
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

