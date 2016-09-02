var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');

exports.makeSubletListing = function(cookie, data, callback) {
    data.type = m_listings.SUBLET;
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

