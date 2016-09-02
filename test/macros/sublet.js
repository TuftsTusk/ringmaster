var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');
var sublet = require('../../lib/models/listings/sublet_listing.js');

exports.makeSubletListing = function(cookie, data, callback) {
    data.type = sublet.name;
    request(app)
        .post('/listing')
        .send(data)
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .end(callback);
}

exports.getSubletListing = function(cookie, id, callback) {
    request(app)
        .get('/listing/'+id)
        .send()
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .end(callback);

}

