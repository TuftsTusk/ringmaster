var mongoose = require('mongoose');
var consts = require('../lib/consts.js');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    email: String,
    passwordHash: String,
    passwordSalt: String,
    recovery: {
        requested: { type: Boolean, default: false },
        key: { type: String, default: "" },
        when: { type: Date, default: Date.now }
    },
    role: { type: Number, default: consts.ROLE_INVALID }
});
module.exports = mongoose.model('User', UserSchema);
