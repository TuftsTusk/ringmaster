var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
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
        required: true,
        reqd_role: consts.ROLE_MODERATOR_PUBLIC
    },
    evt_data: {
        type: Schema.Types.Mixed,
        required: true,
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
            default: true,
            reqd_role: consts.ROLE_CONFIRMED_PUBLIC
        },
        flag: {
            type: Boolean,
            default: false,
            reqd_role: consts.ROLE_MODERATOR_PUBLIC
        },
        history: [listingEventSchema]
    },
    geotag: {
        address: {
            type: String,
            default: '',
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
        }
    }
}, options);

listingSchema.name = LISTING;
listingSchema.methods.toSecure = secure.genListingSecureFunc(listingSchema);
listingSchema.plugin(mongoosePaginate);

function setListingIntegrity(listing, new_visibility, new_flag, user_session) {
    if (new_visibility == null && new_flag != null) {
        listing.integrity.flag = new_flag;
        listing.integrity.history.push({
            who: user_session.login.user.id,
            evt_data: ("flag"+new_flag)
        });
    } else if (new_visibility != null && new_flag == null) {
        listing.integrity.visible = new_visibility;
        listing.integrity.history.push({
            who: user_session.login.user.id,
            evt_data: ("flag"+new_flag)
        });
    } else {
        return false;
    }
}
listingSchema.methods.setVisibility = function(is_visible, user_session) {
    setListingIntegrity(this, is_visible, null, user_session);
}
listingSchema.methods.setFlag = function(is_flagged, user_session) {
    setListingIntegrity(this, null, is_flagged, user_session);
}

var listingModel = mongoose.model(LISTING, listingSchema);

exports.name = LISTING;
exports.model = listingModel;
exports.schema = listingSchema;
