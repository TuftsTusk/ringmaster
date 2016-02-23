var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var account = require('./macros/account.js');

describe('Account lifecycle', function() {
    it('Fail to create an account with no data', function(done){
    request(app)
        .post('/me/register')
        .send({})
        .set('Accept', 'application/json')
        .expect(400)
        .end(function(err, res) {
            if (err) done(err);
            expect(res.body.type).to.equal('MISSING_REGISTRATION_FIELD_FAILURE');
            done();
        });
    });

    it('Fail to create an account with a non-tufts email', function(done){
    request(app)
        .post('/me/register')
        .send({email: 'some.jerk@gmail.com', password: 'foo', confirmpass: 'foo'})
        .set('Accept', 'application/json')
        .expect(400)
        .end(function(err, res) {
            if (err) done(err);
            expect(res.body.type).to.equal('TUFTS_EMAIL_VALIDATION_FAILURE');
            done();
        });
    });

    it('Fail to create an account with mismatched passwords', function(done){
    request(app)
        .post('/me/register')
        .send({email: 'some.jerk@tufts.edu', password: 'foo', confirmpass: 'bar'})
        .set('Accept', 'application/json')
        .expect(400)
        .end(function(err, res) {
            if (err) done(err);
            expect(res.body.type).to.equal('PASSWORD_MISMATCH_FAILURE');
            done();
        });
    });


    it('Successfully add and remove a user account', function(done) {
        account.registerAccount('some.jerk@tufts.edu', 'foo', 'foo', function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(200);
            account.deleteUnconfWithEmail(res.body.email, function(err, res) {
                expect(res.status).to.equal(204);
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
            expect(res.status).to.equal(200);
            account.confirmAccount(res.body.id, res.body.key, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(204);
                account.logInToAccount(email, pass, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(204);
                    account.logOutOfAccount(res.headers['set-cookie'][0], function(err, res) {
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

    it('Successfully recover a user password', function(done) {
        var email = 'some.jerk@tufts.edu';
        var pass = 'foo';
        var confirmpass = 'foo';
        account.registerAccount(email, pass, confirmpass, function(err, res) {
            if (err) done(err);
            expect(res.status).to.equal(200);
            account.confirmAccount(res.body.id, res.body.key, function(err, res) {
                if (err) done(err);
                expect(res.status).to.equal(204);
                account.recoverPassword(email, function(err, res) {
                    if (err) done(err);
                    expect(res.status).to.equal(200);
                    var p = pass + pass;
                    var cp = p;
                    account.changeMyPassword(res.body.id, res.body.confirm_key, p, cp, function(err, res) {
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
