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

var listingSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    role_mask: {
        type: Number,
        enum: consts.ROLE_ALL_MASKS,
        default: consts.ROLE_TUFTS_MASK
    },
    approval: {
        approved: {
            type: Boolean,
            required: false,
            default: false
        },
        approved_by: {
            type: String,
            required: false,
            default: ""
        }
    },
    lastRefreshed: {
        type: Date,
        default: Date.now()
    }
}, options);

var Listing = mongoose.model('Listing', listingSchema);

var photoSchema = new Schema({
    photo_url: {
        type: String,
        validate: {
            validator: function(v) {
                var base_url = 'http://tuskpictures.s3.amazonaws.com/';
                return true || v.substring(0, base_url.length) === base_url;
            },
            message: '{VALUE} is not a valid url to a photo'
        }
    }
});
photoSchema.methods.toSecure = function(roles) {
    var ret_obj = {};
    var list = this;
    miscSchema.eachPath(function(path, schemaType) {
        if ((!("reqd_role" in schemaType.options) && path[0] !=  '_')
            || consts.checkPriv(roles, schemaType.options.reqd_role)) {
            utils.setValueByPath(ret_obj, path, utils.getValueByPath(list, path)); 
        }
    });
    return ret_obj;
}

var miscSchema = new Schema({
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
    image_urls: [photoSchema],
    address: {
        type: String,
        required: false,
        default: "",
        reqd_role: consts.ROLE_INVALID
    }
}, options);
miscSchema.methods.toSecure = function(roles) {
    var ret_obj = {};
    var list = this;
    miscSchema.eachPath(function(path, schemaType) {
        if ((!("reqd_role" in schemaType.options) && path[0] !=  '_')
            || consts.checkPriv(roles, schemaType.options.reqd_role)) {
            utils.setValueByPath(ret_obj, path, utils.getValueByPath(list, path)); 
        }
    });
    return ret_obj;
}

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
    },
    pertinent_class: {
        type: String,
        default: "UNK",
        required: false
    }
}, options);
bookSchema.methods.toSecure = function(roles) {
    var ret_obj = {};
    var list = this;
    miscSchema.eachPath(function(path, schemaType) {
        if ((!("reqd_role" in schemaType.options) && path[0] !=  '_')
            || consts.checkPriv(roles, schemaType.options.reqd_role)) {
            utils.setValueByPath(ret_obj, path, utils.getValueByPath(list, path)); 
        }
    });
    return ret_obj;
}

var BOOK = 'BookListing';
var BookListing = Listing.discriminator(BOOK, bookSchema);

var bedroomSchema = new Schema({
    date_start: {
        type: Date,
        required: true
    },
    date_end: {
        type: Date,
        required: true
    },
    date_end_is_flexible: {
        type: Boolean,
        required: false,
        default: false
    },
    date_start_is_flexible: {
        type: Boolean,
        required: false,
        default: false
    },
    title: {
        type: String,
        required: true
    },
    op_details: {
        pre_furnished: {
            type: Boolean,
            default: false,
            required: false
        },
        incl_air_conditioning: {
            type: Boolean,
            default: false,
            required: false
        },
    },
    rent: {
        type: Number,
        required: true
    },
    photos: [photoSchema]
});
bedroomSchema.methods.toSecure = function(roles) {
    var ret_obj = {};
    var list = this;
    miscSchema.eachPath(function(path, schemaType) {
        if ((!("reqd_role" in schemaType.options) && path[0] !=  '_')
            || consts.checkPriv(roles, schemaType.options.reqd_role)) {
            utils.setValueByPath(ret_obj, path, utils.getValueByPath(list, path)); 
        }
    });
    return ret_obj;
}

var subletSchema = new Schema({
    apt_info: {
        op_details: {
            pre_furnished: {
                type: Boolean,
                default: false,
                required: false
            },
            handicap_accessible: {
                type: Boolean,
                default: false,
                required: false
            },
            incl_air_conditioning: {
                type: Boolean,
                default: false,
                required: false
            },
            incl_washing_machine: {
                type: Boolean,
                default: false,
                required: false
            },
            incl_dryer: {
                type: Boolean,
                default: false,
                required: false
            },
            incl_dishwasher: {
                type: Boolean,
                default: false,
                required: false
            },
            smoking_permitted: {
                type: Boolean,
                default: false,
                required: false
            },
            on_premises_parking: {
                type: Boolean,
                default: false,
                required: false
            },
            pets_permitted: {
                type: Boolean,
                default: false,
                required: false
            }
        },
        address: {
            type: String,
            required: true
        },
        lat: {
            type: String,
            default: ''
        },
        lng: {
            type: String,
            default: ''
        },
        num_occupants: {
            type: Number,
            required: true
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
subletSchema.methods.toSecure = function(roles) {
    var ret_obj = {};
    var list = this;
    miscSchema.eachPath(function(path, schemaType) {
        if ((!("reqd_role" in schemaType.options) && path[0] !=  '_')
            || consts.checkPriv(roles, schemaType.options.reqd_role)) {
            utils.setValueByPath(ret_obj, path, utils.getValueByPath(list, path)); 
        }
    });
    return ret_obj;
}

var SUBLET = 'SubletListing';
var SubletListing = Listing.discriminator(SUBLET, subletSchema);

var furnitureSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        required: true
    },
    dimensions: {
        length: {
            type: Number,
            required: false
        },
        width: {
            type: Number,
            required: false
        },
        height: {
            type: Number,
            required: false
        }
    },
    model_info: {
        manufacturer: {
            type: String,
            required: false
        },
        model_name: {
            type: String,
            required: false
        }
    }

}, options);
var FURNITURE = 'FurnitureListing';
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

