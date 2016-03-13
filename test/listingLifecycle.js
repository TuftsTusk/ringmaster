var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var moderator = require('./macros/moderator.js');
var account = require('./macros/account.js');
var database = require('./macros/database.js');
var m_listings = require('../lib/models/listing.js');
var m_user = require('../lib/models/user.js');
var Utils = require('../lib/utils.js');
var Consts = require('../lib/consts.js');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/tusk';
var SessionStorage = new MongoStore({
        mongooseConnection: mongoose.createConnection(mongoUri)
});

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
    m_listings.Listing.findOneAndRemove({_id:id}, function(err, listing) {
        var _status =(!err && listing) ? 204 : 500;
        callback(err, {"status" : _status});
    });
};

describe('Listing lifecycle', function() {
    var salt = bcrypt.genSaltSync(10);
    var some_jerk = null;

    beforeEach(function(done) {
        m_user.create({
            email:'some.jerk@tufts.edu',
            passwordSalt: salt,
            passwordHash: bcrypt.hashSync('foo', salt),
            role: Consts.ROLE_CONFIRMED_PUBLIC
        }, function(err, user) {
            some_jerk = user;
            done(err);
        });
    });

    it('Fail to add a listing with no data', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        var confirmpass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            makeMiscPost(cookie, {}, function(err, res) {
                if(err) done(err);
                expect(res.status).to.equal(400);
                SessionStorage.destroy(sid);
                some_jerk.remove(done);
            });
        });
    });

    it('Fail to approve a listing as a normal user', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        var confirmpass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            makeMiscPost(cookie, {
                type: 'MiscListing',
                title: 'Hurr Durr',
                description: 'Something for sale!@!!!!0!'
            }, function(err, res) {
                if(err) done(err);
                expect(res.status).to.equal(201);
                moderator.setApproveListingById(res.body.rsc_id, true, function(err, res) {
                    if(err) done(err);
                    expect(res.status).to.equal(403);
                    deletePostFromId(res.body.rsc_id, function(err, res) {
                        SessionStorage.destroy(sid);
                        some_jerk.remove(done);
                    });
                });
            });
        });
    });


    it('Successfully add and remove a single listing', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        var confirmpass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            makeMiscPost(cookie, {
                type: 'MiscListing',
                title: 'Hurr Durr',
                description: 'Something for sale!@!!!!0!'
            }, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(201);
                deletePostFromId(res.body.rsc_id, function(err, res) {
                    SessionStorage.destroy(sid);
                    some_jerk.remove(done);
                });
            });
        });
    });
});

