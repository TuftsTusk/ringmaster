var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');


exports.getUsers = function(callback) {
    request(app)
        .get('/users')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(callback);
}
