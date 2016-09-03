var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');
var options = require('./shared/options.js');
var secure = require('./shared/secure.js');
var base_listing = require('./listing.js');
var photo = require('./shared/photo.js');
var photoSchema = photo.schema;

var TITLE_LEN_MIN = 5;
var TITLE_LEN_MAX = 100;

var MISC = 'MiscListing';
var miscSchema = new Schema({
    type: {
        type: String,
        required: false,
        default: MISC,
        set: function(v) { return this.type; },
        reqd_role: consts.ROLE_INVALID
    },
    title: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return (typeof(v) === typeof('') && v.length > TITLE_LEN_MIN && v.length < TITLE_LEN_MAX);
            },
            message: '{VALUE} is not a valid listing title'
        },
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
    description: {
        type: String,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    photo_urls: [photoSchema]
}, options);
miscSchema.name = MISC;
miscSchema.methods.toSecure = secure.genListingSecureFunc(miscSchema);

var MiscListing = base_listing.model.discriminator(MISC, miscSchema);
exports.model = MiscListing;
exports.name = MISC;
exports.schema = miscSchema;
