var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');

describe('Account lifecycle', function() {
    it('Fail to create an account with no data', function(done){
    request(app)
        .post('/user/register')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
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
        .end(function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(body.success).to.equal(false);
            expect(body.type).to.equal('PASSWORD_MISMATCH_FAILURE');
            done();
        });
    });

    var deleteWithEmail = function(email, callback) {
        request(app)
            .del('/user/'+email)
            .send({})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .end(callback);
    };

    var registerAccount = function(email, password, confirmpass, callback) {
        request(app)
            .post('/user/register')
            .send({
                email: email,
                password: password,
                confirmpass: confirmpass
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .end(callback);
    }

    var logInToAccount = function(email, password, callback) {
        request(app)
            .post('/user/login')
            .send({
                email: email,
                password: password
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .end(callback);
    }

    it('Successfully add and remove a user account', function(done) {
        registerAccount('some.jerk@tufts.edu', 'foo', 'foo', function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(body.success).to.equal(true);
            deleteWithEmail(body.email, function(err, res) {
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
        registerAccount(email, pass, confirmpass, function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(body.success).to.equal(true);
            logInToAccount(email, pass, function(err, res) {
                if (err) done(err);
                deleteWithEmail(email, function(err, res) {
                    if (err) done(err);
                    expect(res.body.success).to.equal(true);
                    done();
                });
                expect(res.body.success).to.equal(true);
            });
        });
    });
});
