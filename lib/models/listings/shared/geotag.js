var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var geotag_schema = new Schema({
    street_address: {
        type: String,
    },
    latitude: {

    },
    longitude: {

    }
});
geotag_schema.name = 'GEOTAG';
geotag_schema.methods.toSecure = 
