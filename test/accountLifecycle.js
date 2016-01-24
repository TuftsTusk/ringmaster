var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var account = require('./macros/account.js');

describe('Account lifecycle', function() {
    it('Fail to create an account with no data', function(done){
    request(app)
        .post('/user/register')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(body.success).to.equal(false);
            expect(body.type).to.equal('MISSING_REGISTRATION_FIELD_FAILURE');
            done();
        });
    });

    it('Fail to create an account with a non-tufts email', function(done){
    request(app)
        .post('/user/register')
        .send({email: 'some.jerk@gmail.com', password: 'foo', confirmpass: 'foo'})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(body.success).to.equal(false);
            expect(body.type).to.equal('TUFTS_EMAIL_VALIDATION_FAILURE');
            done();
        });
    });

    it('Fail to create an account with mismatched passwords', function(done){
    request(app)
        .post('/user/register')
        .send({email: 'some.jerk@tufts.edu', password: 'foo', confirmpass: 'bar'})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(body.success).to.equal(false);
            expect(body.type).to.equal('PASSWORD_MISMATCH_FAILURE');
            done();
        });
    });


    it('Successfully add and remove a user account', function(done) {
        account.registerAccount('some.jerk@tufts.edu', 'foo', 'foo', function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(res.statusCode).to.equal(200);
            expect(body.success).to.equal(true);
            account.deleteUnconfWithEmail(body.email, function(err, res) {
                expect(res.body.user).to.not.equal(null);
                if (err) done(err);
                done();
            });
        });
    });

    it('Successfully add, login, and remove a user account', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        var confirmpass = 'foo';
        account.registerAccount(email, pass, confirmpass, function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(res.statusCode).to.equal(200);
            expect(body.success).to.equal(true);
            account.confirmAccount(body.id, body.key, function(err, res) {
                if (err) done(err);
                expect(body.success).to.equal(true);
                account.logInToAccount(email, pass, function(err, res) {
                    if (err) done(err);
                    expect(res.body.success).to.equal(true);

                    account.logOutOfAccount(res.headers['set-cookie'][0], function(err, res) {
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
