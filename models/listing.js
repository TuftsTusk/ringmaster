var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var options = {
    timestamps: true,
    discriminatorKey: 'kind'
};

var listingSchema = new Schema({
    user_id: { type: String, required: true },
    approval: {
        approved: { type: Boolean, default: false },
        approved_by: { type: String }
    }
}, options);

var Listing = mongoose.model('Listing', listingSchema);

var miscSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true }
}, options);

var MISC = 'MiscListing';
var MiscListing = Listing.discriminator(MISC, miscSchema);

var bookSchema = new Schema({
    title: { type: String, required: true },
    authors: [{ type: String, required: true }],
    edition: { type: String, required: true }
}, options);

var BOOK = 'BookListing';
var BookListing = Listing.discriminator(BOOK, bookSchema);

module.exports = {
    Listing: Listing,
    MiscListing: MiscListing,
    MISC: MISC,
    BookListing: BookListing,
    BOOK: BOOK
};

