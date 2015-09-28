mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ListingSchema = new Schema({
		uuid: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
		user: { type: String, required: true },
		price: { type: Number, required: true },
    imageURL: { type: String, unique: true },
    modified: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Listing', ListingSchema);
