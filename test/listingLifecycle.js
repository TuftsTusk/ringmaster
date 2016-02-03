var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var account = require('./macros/account.js');
var database = require('./macros/database.js');

describe('Listing lifecycle', function(){
    /*afterEach('Verifying that all databases are empty...', function() {
        database.getUsers(function(err, users) {
            if (users.body.length >= 0) {
                console.log("!!! Residual user accounts detected !!!");
                console.log(users.body.users);
            }
        });
    });*/

    after('Remove all residual data', function() {
        request(app)
            .del('/all')
            .send({});
    });

  it('Fail to add a listing with no data', function(done){
    request(app)
      .post('/listing')
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end(function(err, res) {
        if (err) done(err);
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
            .end(callback);
    };

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

                makeMiscPost(cookie, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(201);

                    deletePostFromId(res.body.rsc_id, function(err, res) {
                        if (err) done(err);
                        expect(res.status).to.equal(204);

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
