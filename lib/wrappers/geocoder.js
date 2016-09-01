var geocoderProvider = 'google';
var httpAdapter = 'https';
// optional
var extra = {
    apiKey: 'AIzaSyDE8UDnsYQftCEkjt_k1WuooAez9BsPWCM', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

function geocode_from_address(address, callback) {
    geocoder.geocode(address, callback);
}

exports.geocode = geocode_from_address;
