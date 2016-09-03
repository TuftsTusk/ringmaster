var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var moderator = require('./macros/moderator.js');
var account = require('./macros/account.js');
var book = require('./macros/book.js');
var database = require('./macros/database.js');
var m_listings = require('../lib/models/listings/listing.js');
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



describe('Book Listing Tests', function() {
    var salt = bcrypt.genSaltSync(10);
    var some_jerk = null;
    var hot_bod_mod = null;
    var sadmin = null;
    var saves = 0;
    
    var deletePostFromId = function(id, callback) {
        m_listings.model.findOneAndRemove({_id:id}, function(err, listing) {
            var _status = (!err && listing) ? 204 : 500;
            callback(err, {"status" : _status});
        });
    };

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

    var TEST_DATA_A = {
        user_id: "1",
        type: "BookListing",
        title: "Fear and Loathing in Las Vegas",
        price: 14.99,
        authors: ["Hunter S. Thompson"],
        edition: "Second Vintage Books Edition",
        isbn: "ISBN: 0-679-78589-2"
    };

    it('Fail to create a book listing with no data', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            book.makeBookListing(cookie, {}, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(400);
                SessionStorage.destroy(sid);
                purgeUsers();
                done();
            });
        });
    });

    it('Successfully create a book listing', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            book.makeBookListing(cookie, TEST_DATA_A, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(201);
                deletePostFromId(res.body.rsc_id, function(err, res) {
                    SessionStorage.destroy(sid);
                    purgeUsers();
                    done(err);
                });
            });
        });
    });

    it('Successfully create and retrieve a book listing', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            book.makeBookListing(cookie, TEST_DATA_A, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(201);
                var rsc_id = res.body.rsc_id;
                book.getBookListing(cookie, rsc_id, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(200);
                    deletePostFromId(rsc_id, function(err, res) {
                        SessionStorage.destroy(sid);
                        purgeUsers();
                        done(err);
                    });
                });
            });
        });
    });
});
