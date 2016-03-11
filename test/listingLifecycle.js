var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var account = require('./macros/account.js');
var database = require('./macros/database.js');
var listings = require('../lib/models/listing.js');

var makeMiscPost = function(cookie, body, callback) {
    request(app)
        .post('/listing')
        .send(body)
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(callback);
};

var deletePostFromId = function(id, callback) {
    listings.Listing.findOneAndRemove({_id:id}, function(err, listing) {
        var _status =(!err && listing) ? 204 : 500;
        callback(err, {"status" : _status});
    });
};

describe('Listing lifecycle', function() {
    it('Fail to add a listing with no data', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        var confirmpass = 'foo';
        account.registerAccount(email, pass, confirmpass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(200);
            account.confirmAccount(res.body.id, res.body.key, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(204);
                account.logInToAccount(email, pass, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(204);
                    var cookie = res.headers['set-cookie'][0];
                    makeMiscPost(cookie, {}, function(err, res) {
                        if(err) done(err);
                        expect(res.status).to.equal(400);
                        account.logOutOfAccount(cookie, function(err, res) {
                            if (err) done(err);
                            expect(res.status).to.equal(204);
                            account.deleteWithEmail(email, function(err, res) {
                                if (err) done(err);
                                expect(res.status).to.equal(204);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });


    it('Successfully add and remove a single listing', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        var confirmpass = 'foo';
        account.registerAccount(email, pass, confirmpass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(200);
            account.confirmAccount(res.body.id, res.body.key, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(204);
                account.logInToAccount(email, pass, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(204);
                    var cookie = res.headers['set-cookie'][0];
                    makeMiscPost(cookie, {
                        type: 'MiscListing',
                        title: 'Hurr Durr',
                        description: 'Something for sale!@!!!!0!'
                    }, function(err, res) {
                        if (err) done(err);
                        expect(res.status).to.equal(201);
                        deletePostFromId(res.body.rsc_id, function(err, res) {
                            account.logOutOfAccount(cookie, function(err, res) {
                                if (err) done(err);
                                expect(res.status).to.equal(204);
                                account.deleteWithEmail(email, function(err, res) {
                                    if (err) done(err);
                                    expect(res.status).to.equal(204);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

