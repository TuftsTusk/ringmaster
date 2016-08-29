var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');

var BOOK = 'BookListing';
var bookSchema = new Schema({
    type: {
        type: String,
        required: false,
        default: BOOK,
        set: function(v) { return this.type; },
        reqd_role: consts.ROLE_INVALID
    },
    price: {
        type: Number,
        required: true,
        validate: {
            validator: function(v) {
                return (typeof(v) === typeof(8)) && v >= 0;
            },
            message: '{VALUE} is not a valid price'
        },
        reqd_role: consts.ROLE_INVALID
    },
    title: {
        type: String,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    authors: [{
        type: String,
        required: true,
        reqd_role: consts.ROLE_INVALID
    }],
    edition: {
        type: String,
        required: false,
        default: 'UNK',
        reqd_role: consts.ROLE_INVALID
    },
    pertinent_class: {
        type: String,
        default: 'UNK',
        required: false,
        reqd_role: consts.ROLE_INVALID
    },
    isbn: {
        type: String,
        default: 'UNK',
        required: false,
        reqd_role: consts.ROLE_INVALID,
        validate: {
            validator: function(v) {
                /(ISBN[-]*(1[03])*[ ]*(: ){0,1})*(([0-9Xx][- ]*){13}|([0-9Xx][- ]*){10})/
            },
            message: '{VALUE} is not a valid ISBN number'
        }
    }
}, options);
bookSchema.name = BOOK;
bookSchema.methods.toSecure = genListingSecureFunc(bookSchema);

var BookListing = Listing.discriminator(BOOK, bookSchema);

