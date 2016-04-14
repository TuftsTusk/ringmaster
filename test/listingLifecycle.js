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
}

var getMiscPostById = function(cookie, id, callback) {
    request(app)
        .get('/listing/'+id)
        .send({})
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(callback);
}

var deletePostFromId = function(id, callback) {
    m_listings.Listing.findOneAndRemove({_id:id}, function(err, listing) {
        var _status = (!err && listing) ? 204 : 500;
        callback(err, {"status" : _status});
    });
}

describe('Listing lifecycle', function() {
    var salt = bcrypt.genSaltSync(10);
    var some_jerk = null;
    var hot_bod_mod = null;
    var sadmin = null;
    var saves = 0;

    beforeEach(function(done) {
        m_user.create([{
            email:'some.jerk@tufts.edu',
            passwordSalt: salt,
            passwordHash: bcrypt.hashSync('foo', salt),
            role: Consts.ROLE_CONFIRMED_PUBLIC
        }, {
            email:'hot.bod.mod@tufts.edu',
            passwordSalt: salt,
            passwordHash: bcrypt.hashSync('foo', salt),
            role: Consts.ROLE_MODERATOR_PUBLIC
        }, {
            email:'sadmin@tufts.edu',
            passwordSalt: salt,
            passwordHash: bcrypt.hashSync('foo', salt),
            role: Consts.ROLE_ADMIN
        }], function(err, users) {
            some_jerk = users[0];
            hot_bod_mod = users[1];
            sadmin = users[2];
            done(err);
        });
    });

    var purgeUsers = function(done) {
        if (some_jerk != null)
            some_jerk.remove();
        if (hot_bod_mod != null)
            hot_bod_mod.remove();
        if (sadmin != null)
            sadmin.remove();
    }

    it('Fail to add a listing with no data', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
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
                purgeUsers();
                done();
            });
        });
    });

    it('Successfully add, request, and remove a single listing', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            makeMiscPost(cookie, {
                type: 'MiscListing',
                title: 'Hurr Durr',
                description: 'Something for sale!@!!!!0!',
                price: 100
            }, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(201);
                var rsc_id = res.body.rsc_id;
                getMiscPostById(cookie, rsc_id, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(200);
                    deletePostFromId(rsc_id, function(err, res) {
                        SessionStorage.destroy(sid);
                        purgeUsers();
                        done();
                    });
                })
            });
        });
    });

    it('Fail to approve a listing as a normal user', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            makeMiscPost(cookie, {
                type: 'MiscListing',
                title: 'Hurr Durr',
                description: 'Something for sale!@!!!!0!',
                price: 100
            }, function(err, res) {
                if(err) done(err);
                expect(res.status).to.equal(201);
                var rsc_id = res.body.rsc_id;
                moderator.setApproveListingById(rsc_id, true, cookie, function(err, res) {
                    if(err) done(err);
                    expect(res.status).to.equal(403);
                    deletePostFromId(rsc_id, function(err, res) {
                        SessionStorage.destroy(sid);
                        purgeUsers();
                        done(err);
                    });
                });
            });
        });
    });

    it('Approve a listing as a moderator', function(done) {
        var mod_email = 'hot.bod.mod@tufts.edu';
        var pass = 'foo';

        m_listings.MiscListing.create({
            user_id: some_jerk._id,
            title: 'Hurr Durr',
            description: 'Something for sale!@!!!!0!',
            price: 100
        }, function(err, listing) {
            if (err) done(err);
            else {
                account.logInToAccount(mod_email, pass, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(204);
                    var cookie = res.headers['set-cookie'][0];
                    var re_sid = /sid=s%3A([^;\.]+)/;
                    var sid = re_sid.exec(cookie)[1];
                    moderator.setApproveListingById(listing._id, true, cookie, function(err, res) {
                        if(err) done(err);
                        expect(res.status).to.equal(204);
                        deletePostFromId(listing._id, function(err, res) {
                            SessionStorage.destroy(sid);
                            purgeUsers();
                            done(err);
                        });
                    });
                });
            }
        });
    });
});

