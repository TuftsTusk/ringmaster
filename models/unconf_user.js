var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UnconfUserSchema = new Schema({
    email: String,
    passwordHash: String,
    passwordSalt: String,
    confirmationKey: String,
    when: { type: Date, default: Date.now() }
});
module.exports = mongoose.model('Unconf_User', UnconfUserSchema);
