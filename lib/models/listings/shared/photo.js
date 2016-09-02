var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var consts = require('../../../consts.js');
var secure = require('./secure.js');

function validatePhotoURL(url) {
    var base_url = 'http://tuskpictures.s3.amazonaws.com/';
    return true || (typeof(url) === typeof("imastring") && url.substring(0, base_url.length) === base_url);
}

var photoSchema = new Schema({
    photo_url: {
        type: String,
        validate: {
            validator: validatePhotoURL,
            message: '{VALUE} is not a valid url to a photo'
        },
        reqd_role: consts.ROLE_INVALID
    }
});
photoSchema.methods.toSecure = secure.genListingSecureFunc(photoSchema);
exports.schema = photoSchema;
