var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');
var book_listing = require('../../lib/models/listings/book_listing.js');

exports.makeBookListing = function(cookie, data, callback) {
    data.type = book_listing.name;
    request(app)
        .post('/listing')
        .send(data)
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .end(callback);
}

exports.getBookListing = function(cookie, id, callback) {
    request(app)
        .get('/listing/'+id)
        .send({})
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .end(callback);
}

