var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');
var options = require('./shared/options.js');
var secure = require('./shared/secure.js');
var base_listing = require('./listing.js');
var photo = require('./shared/photo.js');
var photoSchema = photo.schema;
var validation = require('../../validation.js');

var BEDROOM_TITLE_LEN_MIN = 1;
var BEDROOM_TITLE_LEN_MAX = 100;

var bedroomSchema = new Schema({
    date_start: {
        type: Date,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    date_end: {
        type: Date,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    date_end_is_flexible: {
        type: Boolean,
        required: false,
        default: false,
        reqd_role: consts.ROLE_INVALID
    },
    date_start_is_flexible: {
        type: Boolean,
        required: false,
        default: false,
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
                    v.length >= BEDROOM_TITLE_LEN_MIN &&
                    v.length <= BEDROOM_TITLE_LEN_MAX);
            },
            message: '{VALUE} is not a valid listing title'
        },
        reqd_role: consts.ROLE_INVALID
    },
    op_details: {
        pre_furnished: {
            type: Boolean,
            default: false,
            required: false,
            reqd_role: consts.ROLE_INVALID
        },
        incl_air_conditioning: {
            type: Boolean,
            default: false,
            required: false,
            reqd_role: consts.ROLE_INVALID
        },
    },
    rent: {
        type: Number,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    photos: [photoSchema]
});
bedroomSchema.name = 'BEDROOM';
bedroomSchema.methods.toSecure = secure.genListingSecureFunc(bedroomSchema);

var SUBLET = 'SubletListing';
var subletSchema = new Schema({
    type: {
        type: String,
        required: false,
        default: SUBLET,
        set: function(v) { return this.type; },
        reqd_role: consts.ROLE_INVALID
    },
    address_required: {
        type: Boolean,
        default: true,
        reqd_role: consts.ROLE_INVALID
    },
    apt_info: {
        op_details: {
            pre_furnished: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            handicap_accessible: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            incl_air_conditioning: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            incl_washing_machine: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            incl_dryer: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            incl_dishwasher: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            smoking_permitted: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            on_premises_parking: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            },
            pets_permitted: {
                type: Boolean,
                default: false,
                required: false,
                reqd_role: consts.ROLE_INVALID
            }
        },
        num_occupants: {
            type: Number,
            required: true,
            reqd_role: consts.ROLE_INVALID
        }
    },
    bedrooms: [bedroomSchema],
    common_area_photos: {
        kitchen: [photoSchema],
        living_room: [photoSchema],
        bathroom: [photoSchema],
        other: [photoSchema]
    }
}, options);
subletSchema.name = SUBLET;
subletSchema.methods.toSecure = secure.genListingSecureFunc(subletSchema);

var SubletListing = base_listing.model.discriminator(SUBLET, subletSchema);
exports.model = SubletListing;
exports.name = SUBLET;
exports.schema = subletSchema;
