var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');

exports.deleteWithEmail = function(email, callback) {
    request(app)
        .del('/user/'+email)
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(callback);
};

exports.deleteUnconfWithEmail = function(email, callback) {
    request(app)
        .del('/unconf_user/'+email)
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(callback);
};

exports.registerAccount = function(email, password, confirmpass, callback) {
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

exports.logInToAccount = function(email, password, callback) {
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

exports.logOutOfAccount = function(cookie, callback) {
    request(app)
        .post('/user/logout')
        .send({})
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .expect('Content-Type', /json/)
        .end(callback);
}

exports.confirmAccount = function(id, key, callback) {
    request(app)
        .get('/user/'+id+'/confirm')
        .query({key:key})
        .set('Accept', 'application/json')
        .end(callback);
}


