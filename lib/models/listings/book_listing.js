var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');
var options = require('./shared/options.js');
var secure = require('./shared/secure.js');
var base_listing = require('./listing.js');
var photo = require('./shared/photo.js');
var photoSchema = photo.schema;
var validation = require('../../validation.js');

var BOOK_TITLE_LEN_MIN = 1;
var BOOK_TITLE_LEN_MAX = 100;
var BOOK_AUTHOR_LEN_MIN = 1;
var BOOK_AUTHOR_LEN_MAX = 100;
var BOOK_EDITION_LEN_MIN = 1;
var BOOK_EDITION_LEN_MAX = 100;
var BOOK_CLASS_LEN_MIN = 1;
var BOOK_CLASS_LEN_MAX = 100;

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
                return (typeof(v) === 'number') && v >= 0;
            },
            message: '{VALUE} is not a valid price'
        },
        reqd_role: consts.ROLE_INVALID
    },
    title: {
        type: String,
        required: true,
        set: function(v) {
            return validation.escape(v);
        },
        validate: {
            validator: function(v) {
                return (typeof(v) === 'string' &&
                    v.length >= BOOK_TITLE_LEN_MIN &&
                    v.length <= BOOK_TITLE_LEN_MAX);
            },
            message: '{VALUE} is not a valid listing title'
        },
        reqd_role: consts.ROLE_INVALID
    },
    authors: [{
        type: String,
        required: true,
        set: function(v) {
            return validation.escape(v);
        },
        validate: {
            validator: function(v) {
                return (typeof(v) === 'string' &&
                    v.length >= BOOK_AUTHOR_LEN_MIN &&
                    v.length <= BOOK_AUTHOR_LEN_MAX);
            },
            message: '{VALUE} is not a valid listing title'
        },
        reqd_role: consts.ROLE_INVALID
    }],
    edition: {
        type: String,
        required: false,
        set: function(v) {
            return validation.escape(v);
        },
        validate: {
            validator: function(v) {
                return (typeof(v) === 'string' &&
                    v.length >= BOOK_EDITION_LEN_MIN &&
                    v.length <= BOOK_EDITION_LEN_MAX);
            },
            message: '{VALUE} is not a valid listing title'
        },
        default: 'UNK',
        reqd_role: consts.ROLE_INVALID
    },
    pertinent_class: {
        type: String,
        default: 'UNK',
        required: false,
        set: function(v) {
            return validation.escape(v);
        },
        validate: {
            validator: function(v) {
                return (typeof(v) === 'string' &&
                    v.length >= BOOK_CLASS_LEN_MIN &&
                    v.length <= BOOK_CLASS_LEN_MAX);
            },
            message: '{VALUE} is not a valid listing title'
        },
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
    },
    photo_urls: [photoSchema]
}, options);
bookSchema.name = BOOK;
bookSchema.methods.toSecure = secure.genListingSecureFunc(bookSchema);

var BookListing = base_listing.model.discriminator(BOOK, bookSchema);
exports.model = BookListing;
exports.schema = BookListing.schema;
exports.name = BOOK;
