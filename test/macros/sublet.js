var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');
var m_listings = require('../../lib/models/listing.js');

exports.makeSubletListing = function(cookie, data, callback) {
    data.type = m_listings.SUBLET;
    //console.log("Making this sublet");
    //console.log(JSON.stringify(data));
    //console.log("---");
    request(app)
        .post('/listing')
        .send(data)
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .end(callback);
}
