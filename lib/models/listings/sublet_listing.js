var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');

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
bedroomSchema.methods.toSecure = genListingSecureFunc(bedroomSchema);

var SUBLET = 'SubletListing';
var subletSchema = new Schema({
    type: {
        type: String,
        required: false,
        default: SUBLET,
        set: function(v) { return this.type; },
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
        address: {
            type: String,
            required: true,
            reqd_role: consts.ROLE_INVALID
        },
        lat: {
            type: String,
            default: '',
            reqd_role: consts.ROLE_INVALID
        },
        lng: {
            type: String,
            default: '',
            reqd_role: consts.ROLE_INVALID
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
subletSchema.methods.toSecure = genListingSecureFunc(subletSchema);

var SubletListing = Listing.discriminator(SUBLET, subletSchema);

