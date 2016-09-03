var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');
var options = require('./shared/options.js');
var secure = require('./shared/secure.js');
var base_listing = require('./listing.js');
var photo = require('./shared/photo.js');
var photoSchema = photo.schema;


var FURNITURE = 'FurnitureListing';
var furnitureSchema = new Schema({
    type: {
        type: String,
        required: false,
        default: FURNITURE,
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
    description: {
        type: String,
        required: true,
        reqd_role: consts.ROLE_INVALID
    },
    title: {
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
furnitureSchema.methods.toSecure = secure.genListingSecureFunc(furnitureSchema);

var FurnitureListing = base_listing.model.discriminator(FURNITURE, furnitureSchema);
exports.model = FurnitureListing;
exports.name = FURNITURE;
exports.schema = furnitureSchema;
