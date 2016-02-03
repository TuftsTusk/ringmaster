var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    email: String,
    passwordHash: String,
    passwordSalt: String,
    recovery: {
        requested: { type: Boolean, default: false },
        key: { type: String, default: "" },
        when: { type: Date, default: Date.now }
    }
});
module.exports = mongoose.model('User', UserSchema);
