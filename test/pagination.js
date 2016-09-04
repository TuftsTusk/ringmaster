var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var moderator = require('./macros/moderator.js');
var account = require('./macros/account.js');
var paginate = require('./macros/paginate.js');
var database = require('./macros/database.js');
var m_listings = require('../lib/models/listings/listing.js');
var m_misc_listing = require('../lib/models/listings/misc_listing.js');
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

function random(min, max) {
    return Math.random() * (max - min) + min;
}

describe('Pagination Tests', function() {
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

        var words = ['Great', 'Modular', 'Telephone', 'Wristwatch', 'Maniac', 'Carnivore', 'the', 'Only', 'Harmless', 'Devouring', 'Manticore', 'from', 'the', 'Depths', 'of', 'Hell'];
        var misc_listings = [];
        for (var i = 0; i < 1000; i++) {
            var title = words[random(0, words.length)] + ' ' + words[random(0, words.length)] + ' ' + words[random(0, words.length)]
            var price = random(1, 1000);
            var desc = '';
            for (var j=0; j<30; j++) {
                desc += words[random(0, words.length)] + ' ';
            }
            var photos = [];
            var misc = {
                'title': title,
                'price': price,
                'description': desc,
                'photo_urls': photos
            };
        }
        m_misc_listing.create(misc_listings);
    });

    var purgeUsers = function(done) {
        if (some_jerk != null)
            some_jerk.remove();
        if (hot_bod_mod != null)
            hot_bod_mod.remove();
        if (sadmin != null)
            sadmin.remove();
    }

    it('Successfully request the same results using an archived search', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        account.logInToAccount(email, pass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(204);
            var cookie = res.headers['set-cookie'][0];
            var re_sid = /sid=s%3A([^;\.]+)/;
            var sid = re_sid.exec(cookie)[1];
            var query = {};
            paginate.getListingsWithQuery(query, function(err, res) {
                var listings = res.body;
            });
        });
    });

});

