var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var options = {
    timestamps: true,
    discriminatorKey: 'listing'
};

var listingSchema = new Schema({
    user_id: { type: String, required: true },
    approved: { type: Boolean, required: false },
}, options);

var Listing = mongoose.model('Listing', listingSchema);

var miscSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true }
});


var MiscListing = Listing.discriminator('MiscListing', miscSchema, options);

module.exports = {
    Listing: Listing,
    MiscListing: MiscListing
};

