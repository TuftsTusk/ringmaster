mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EmailScheme = new Schema({
    user_id: { type: String, required: true },
    email: { type: String, required: true },
    last_modified: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Emails', EmailScheme);
