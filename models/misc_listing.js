mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MiscListingSchema = new Schema({
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    last_modified: { type: Date, default: Date.now }
});
module.exports = mongoose.model('MiscListing', MiscListingSchema);
