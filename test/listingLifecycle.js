var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var account = require('./macros/account.js');
<<<<<<< HEAD
var database = require('./macros/database.js');
=======
>>>>>>> 4134880e23bd8206fcf93100082df5dfe573a1ba

describe('Listing lifecycle', function(){
    afterEach('Verifying that all databases are empty...', function() {
        database.getUsers(function(err, users) {
            if (users.body.length >= 0) {
                console.log("!!! Residual user accounts detected !!!");
                console.log(users.body.users);
            }
        });
    });

  it('Fail to add a listing with no data', function(done){
    request(app)
      .post('/listing')
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) done(err);
        //var body = JSON.parse(res.text);
        var body = res.body;
        expect(body.success).to.equal(false);
        done();
      });
  });

  it('Successfully add and remove a single listing', function(done) {
    var makeMiscPost = function(cookie, callback) {
        request(app)
            .post('/listing')
            .send({
                type: 'MiscListing',
                title: 'Hurr Durr',
                body: 'Something for sale!@!!!!0!'
            })
            .set('Cookie', cookie)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .end(callback);
    };

    var deletePostFromId = function(id, callback) {
        request(app)
            .del('/listing/'+id)
            .send({})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .end(callback);
    };

    var email = 'some.jerk@tufts.edu';
    var pass = 'foo';
    var confirmpass = 'foo';
    account.registerAccount(email, pass, confirmpass, function(err, res) {
        if (err) done(err);
        var body = res.body;
        expect(res.statusCode).to.equal(200);
        expect(body.success).to.equal(true);
        account.confirmAccount(body.id, body.key, function(err, res) {
<<<<<<< HEAD
=======
            if (err) done(err);
            expect(body.success).to.equal(true);
            account.logInToAccount(email, pass, function(err, res) {
                if (err) done(err);
                expect(res.body.success).to.equal(true);
                
                var cookie = res.headers['set-cookie'][0];

                makeMiscPost(cookie, function(err, res) {
                    if (err) done(err);
                    expect(res.body.success).to.equal(true);

                    deletePostFromId(res.body.rsc_id, function(err, res) {
                        if (err) done(err);
                        expect(res.body.success).to.equal(true);

                        account.logOutOfAccount(cookie, function(err, res) {
                            if (err) done(err);
                            expect(res.body.success).to.equal(true);

                            account.deleteWithEmail(email, function(err, res) {
                                if (err) done(err);
                                expect(res.body.success).to.equal(true);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    /*request(app)
        .post('/listing')
        .send({
            address: "587 Boston Ave., Somerville MA 02144",
            date_range: "2015-08-02,2016-08-02",
            rent: 750,
            bedrooms_available: 5,
            bathrooms: 3,
            image_gallery_link: "img link hurrdurr",
            est_utilities: 100,
            pre_furnished: true,
            notes: "Some notes here!"
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(function(err, res) {
>>>>>>> 4134880e23bd8206fcf93100082df5dfe573a1ba
            if (err) done(err);
            expect(body.success).to.equal(true);
<<<<<<< HEAD
            account.logInToAccount(email, pass, function(err, res) {
                if (err) done(err);
                expect(res.body.success).to.equal(true);
                
                var cookie = res.headers['set-cookie'][0];

                makeMiscPost(cookie, function(err, res) {
                    if (err) done(err);
                    expect(res.body.success).to.equal(true);

                    deletePostFromId(res.body.rsc_id, function(err, res) {
                        if (err) done(err);
                        expect(res.body.success).to.equal(true);

                        account.logOutOfAccount(cookie, function(err, res) {
                            if (err) done(err);
                            expect(res.body.success).to.equal(true);

                            account.deleteWithEmail(email, function(err, res) {
                                if (err) done(err);
                                expect(res.body.success).to.equal(true);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
=======
            deleteWithID(body.rsc_id);
        });*/
>>>>>>> 4134880e23bd8206fcf93100082df5dfe573a1ba
  });
});
