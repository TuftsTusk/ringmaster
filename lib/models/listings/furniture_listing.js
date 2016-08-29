var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../consts.js');


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

