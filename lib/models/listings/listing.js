var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');
var options = require('./shared/options.js');
var secure = require('./shared/secure.js');

var LISTING = 'Listing';
var listingEventSchema = new Schema({
    when: {
        type: Date,
        default: Date.now,
        reqd_role: consts.ROLE_MODERATOR_PUBLIC
    },
    who: {
        type: String,
        reqd_role: consts.ROLE_MODERATOR_PUBLIC
    },
    evt_data: {
        type: Schema.Types.Mixed,
        reqd_role: consts.ROLE_MODERATOR_PUBLIC
    }
});

var listingSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        reqd_role: consts.ROLE_MODERATOR_PUBLIC
    },
    role_mask: {
        type: Number,
        enum: consts.ROLE_ALL_MASKS,
        default: consts.ROLE_TUFTS_MASK,
        reqd_role: consts.ROLE_ADMIN
    },
    approval: {
        approved: {
            type: Boolean,
            required: false,
            default: false,
            reqd_role: consts.ROLE_MODERATOR_PUBLIC
        },
        approved_by: {
            type: String,
            required: false,
            default: "",
            reqd_role: consts.ROLE_ADMIN
        }
    },
    lastRefreshed: {
        type: Date,
        default: Date.now,
        reqd_role: consts.ROLE_MODERATOR_PUBLIC
    },
    integrity: {
        visible: {
            type: Boolean,
            default: false,
            reqd_role: consts.ROLE_MODERATOR_PUBLIC
        },
        flag: {
            type: Boolean,
            default: false,
            reqd_role: consts.ROLE_MODERATOR_PUBLIC
        },
        history: [listingEventSchema]
    }
}, options);
listingSchema.name = LISTING;
listingSchema.methods.toSecure = secure.genListingSecureFunc(listingSchema);

var listingModel = mongoose.model(LISTING, listingSchema);

exports.name = LISTING;
exports.model = listingModel;
exports.schema = listingSchema;
