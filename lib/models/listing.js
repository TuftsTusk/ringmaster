var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../consts.js');
var utils = require('../utils.js');

TITLE_LEN_MIN = 5;
TITLE_LEN_MAX = 100;

var options = {
    timestamps: true,
    discriminatorKey: 'kind'
};

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

var Listing = mongoose.model('Listing', listingSchema);

function validatePhotoURL(url) {
    var base_url = 'http://tuskpictures.s3.amazonaws.com/';
    return true || (typeof(url) === typeof("imastring") && url.substring(0, base_url.length) === base_url);
}

var photoSchema = new Schema({
    photo_url: {
        type: String,
        validate: {
            validator: validatePhotoURL,
            message: '{VALUE} is not a valid url to a photo'
        },
        reqd_role: consts.ROLE_INVALID
    }
});
photoSchema.name = 'PHOTO';

function genListingSecureFunc(schema) {
    return function(roles, user_id, include_id) {
        var ret_obj = {};
        var list = this;
        schema.eachPath(function(path, schemaType) {
            if (Array.isArray(schemaType.options.type)) {
                var arr = utils.getValueByPath(list, path);
                for (var i=0; i<arr.length; i++) {
                    var e = arr[i];
                    if (typeof(e) == typeof({}) && 'toSecure' in e)
                        utils.pushValueByPath(ret_obj, path, e.toSecure());
                    else
                        utils.pushValueByPath(ret_obj, path, e);
                }
            } else if ("reqd_role" in schemaType.options && consts.checkPriv(roles, schemaType.options.reqd_role)) {
                utils.setValueByPath(ret_obj, path, utils.getValueByPath(list, path));
            }
        });
        if (include_id || ("user_id" in list && user_id && user_id == list.user_id)) {
            utils.setValueByPath(ret_obj, "_id", utils.getValueByPath(list, "_id"));
        }
        return ret_obj;
    }
}

function genPhotoSecureFunc() {
    return function(roles, user_id, include_id) {
        photoSchema.eachPath(function(path, schemaType) {

        });
        return this;
    }
}

photoSchema.methods.toSecure = genListingSecureFunc(photoSchema);

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
    photo_urls: [photoSchema],
    address: {
        type: String,
        required: false,
        default: "",
        reqd_role: consts.ROLE_CONFIRMED_PUBLIC
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
}, options);
miscSchema.name = MISC;
miscSchema.methods.toSecure = genListingSecureFunc(miscSchema);

var MiscListing = Listing.discriminator(MISC, miscSchema);

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

var FURNITURE = 'FurnitureListing';
var furnitureSchema = new Schema({
    type: {
        type: String,
        required: false,
        default: FURNITURE,
        set: function(v) { return this.type; },
        reqd_role: consts.ROLE_INVALID
    },
    catagory: {
        type: String,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    condition: {
        type: String,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    dimensions: {
        length: {
            type: Number,
            required: false,
            reqd_role: consts.ROLE_INVALID
        },
        width: {
            type: Number,
            required: false,
            reqd_role: consts.ROLE_INVALID
        },
        height: {
            type: Number,
            required: false,
            reqd_role: consts.ROLE_INVALID
        }
    },
    model_info: {
        manufacturer: {
            type: String,
            required: false,
            reqd_role: consts.ROLE_INVALID
        },
        model_name: {
            type: String,
            required: false,
            reqd_role: consts.ROLE_INVALID
        }
    },
    photo_urls: [photoSchema]
}, options);
furnitureSchema.name = FURNITURE;
furnitureSchema.methods.toSecure = genListingSecureFunc(furnitureSchema);

var FurnitureListing = Listing.discriminator(FURNITURE, furnitureSchema);


module.exports = {
    Listing: Listing,
    _MiscSchema: miscSchema,
    MiscListing: MiscListing,
    MISC: MISC,
    _BookSchema: bookSchema,
    BookListing: BookListing,
    BOOK: BOOK,
    SUBLET: SUBLET,
    _SubletSchema: subletSchema,
    SubletListing: SubletListing,
    FURNITURE: FURNITURE,
    FurnitureListing: FurnitureListing
};
