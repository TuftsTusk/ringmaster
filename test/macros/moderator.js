var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');

exports.setApproveListingById = function(id, approve, callback) {
    request(app)
        .put('/listing/'+id.toString()+'/approve')
        .set('Accept', 'application/json')
        .send(approve.toString())
        .end(callback);
}

