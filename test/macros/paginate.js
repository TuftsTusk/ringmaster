var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');

exports.getListingsWithQuery = function(query_obj, callback) {
    request(app)
        .get('/listing)
        .query(query_obj)
        .send({})
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(callback);
}
