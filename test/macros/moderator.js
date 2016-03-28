var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');

exports.setApproveListingById = function(id, approve, cookie, callback) {
    request(app)
        .put('/listing/'+id.toString()+'/approval')
        .set('Accept', 'application/json')
        .set('Content-Type', 'text/plain')
        .set('Cookie', cookie)
        .send(approve.toString())
        .end(callback);
}

