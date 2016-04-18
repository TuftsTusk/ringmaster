var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var moderator = require('./macros/moderator.js');
var account = require('./macros/account.js');
var sublet = require('./macros/sublet.js');
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



describe('Sublet Listing Tests', function() {
    var salt = bcrypt.genSaltSync(10);
    var some_jerk = null;
    var hot_bod_mod = null;
    var sadmin = null;
    var saves = 0;
    
    var deletePostFromId = function(id, callback) {
        m_listings.Listing.findOneAndRemove({_id:id}, function(err, listing) {
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
        "user_id": "1",
        "type": "SubletListing",
        "apt_info": {
            "address": "92 Curtis St., Somerville MA 02144",
            "num_occupants": 4,
            "op_details": {
                "pre_furnished": true,
                "incl_air_conditioning": true,
                "incl_washing_machine": true,
                "incl_dryer": true,
                "incl_dishwasher": true,
                "smoking_permitted": true,
                "handicap_accessible": true,
                "on_premises_parking": true,
                "pets_permitted": true
            }
        },
        "bedrooms": [
            {
                "date_start": "2016-05-23T00:00:00.000Z",
                "date_end": "2016-08-23T00:00:00.000Z",
                "rent": 667,
                "title": "Jackson's room",
                "photos": [
                    {photo_url: "http:\/\/www.pawderosa.com\/images\/puppies.jpg"},
                    {photo_url: "http:\/\/www.pamperedpetz.net\/wp-content\/uploads\/2015\/09\/Puppy1.jpg"},
                    {photo_url: "http:\/\/cdn.skim.gs\/image\/upload\/v1456344012\/msi\/Puppy_2_kbhb4a.jpg"},
                    {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/497043545505947648\/ESngUXG0.jpeg"}
                ],
                "op_details": {
                    "pre_furnished": true,
                    "incl_air_conditioning": true
                },
                "date_start_is_flexible": true,
                "date_end_is_flexible": true
            },
            {
                "date_start": "2016-05-14T00:00:00.000Z",
                "date_end": "2016-09-10T00:00:00.000Z",
                "rent": 750,
                "title": "Conor's room",
                "photos": [
                    {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                    {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"},
                    {photo_url: "http:\/\/www.findcatnames.com\/wp-content\/uploads\/2014\/09\/453768-cats-cute.jpg"},
                    {photo_url: "https:\/\/www.screensaversplanet.com\/img\/screenshots\/screensavers\/large\/cute-cats-1.png"}
                ]
            }
        ],
        "common_area_photos": {
            "kitchen": [
                {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
            ],
            "living_room": [
                {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
            ],
            "bathroom": [
                {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
            ],
            "other": [
                {photo_url: "http:\/\/www.fndvisions.org\/img\/cutecat.jpg"},
                {photo_url: "https:\/\/pbs.twimg.com\/profile_images\/567285191169687553\/7kg_TF4l.jpeg"}
            ]
        }
    };

    it('Fail to create a sublet listing with no data', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            sublet.makeSubletListing(cookie, {}, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(400);
                SessionStorage.destroy(sid);
                purgeUsers();
                done();
            });
        });
    });

    it('Successfully create a sublet listing', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            sublet.makeSubletListing(cookie, TEST_DATA_A, function(err, res) {
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

    it('Successfully create and retrieve a sublet listing', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            sublet.makeSubletListing(cookie, TEST_DATA_A, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(201);
                var rsc_id = res.body.rsc_id;
                sublet.getSubletListing(cookie, rsc_id, function(err, res) {
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
