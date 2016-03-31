var mongoose = require('mongoose');
var Schema = mongoose.Schema;

TITLE_LEN_MIN = 5;
TITLE_LEN_MAX = 30;

var options = {
    timestamps: true,
    discriminatorKey: 'kind'
};

var listingSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    approval: {
        approved: {
            type: Boolean,
            default: false
        },
        approved_by: {
            type: String
        }
    },
    price: {
        type: Number,
        required: true,
        validate: {
            validator: function(v) {
                return (typeof(v) === typeof(8)) && v >= 0;
            },
            message: '{VALUE} is not a valid price'
        }
    }
}, options);

var Listing = mongoose.model('Listing', listingSchema);

var miscSchema = new Schema({
    title: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return (typeof(v) === typeof('') && v.length > TITLE_LEN_MIN && v.length < TITLE_LEN_MAX);
            },
            message: '{VALUE} is not a valid listing title'
        }
    },
    description: {
        type: String,
        required: true
    }
}, options);

var MISC = 'MiscListing';
var MiscListing = Listing.discriminator(MISC, miscSchema);

var bookSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    authors: [{
        type: String,
        required: true
    }],
    edition: {
        type: String,
        required: true
    }
}, options);

var BOOK = 'BookListing';
var BookListing = Listing.discriminator(BOOK, bookSchema);

var subletSchema = new Schema({
    address: {
        type: String,
        required: true
    }
}, options);

var SUBLET = 'SubletListing';
var SubletListing = Listing.discriminator(SUBLET, subletSchema);

module.exports = {
    Listing: Listing,
    MiscListing: MiscListing,
    MISC: MISC,
    BookListing: BookListing,
    BOOK: BOOK
};

