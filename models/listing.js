mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ListingSchema = new Schema({
	user_id: { type: String, required: true },
    address: { type: String, required: true },
    date_range: { type: String, required: true },
	rent: { type: Number, required: true },
	bedrooms_available: { type: Number, required: true, default: 1 },
	bathrooms: { type: Number, required: true },
	image_gallery_link: { type: String, required: false, unique: true },
	est_utilities: { type: Number, required: false },
	pre_furnished: { type: Boolean, required: false },
	notes: { type: String, required: false },
    last_modified: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Listing', ListingSchema);
