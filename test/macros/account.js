var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');

exports.deleteWithEmail = function(email, callback) {
    request(app)
        .del('/dev/user/'+email)
        .send({})
        .end(callback);
};

exports.deleteUnconfWithEmail = function(email, callback) {
    request(app)
        .del('/dev/unconf_user/'+email)
        .send({})
        .end(callback);
};

exports.registerAccount = function(email, password, confirmpass, callback) {
    request(app)
        .post('/me/register')
        .send({
            email: email,
            password: password,
            confirmpass: confirmpass
        })
        .set('Accept', 'application/json')
        .end(callback);
}

exports.logInToAccount = function(email, password, callback) {
    request(app)
        .post('/me/login')
        .send({
            email: email,
            password: password
        })
        .set('Accept', 'application/json')
        .end(callback);
}

exports.logOutOfAccount = function(cookie, callback) {
    request(app)
        .post('/me/logout')
        .send({})
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .end(callback);
}

exports.confirmAccount = function(id, key, callback) {
    request(app)
        .get('/user/'+id+'/confirm')
        .query({key:key})
        .set('accept', 'application/json')
        .end(callback);
}

exports.recoverPassword = function(email, callback) {
    request(app)
        .post('/user/'+email+'/recover')
        .set('accept', 'application/json')
        .end(callback);
}

exports.changeMyPassword = function(user_id, confirm_key, password, confirmpass, callback) {
    request(app)
        .put('/me/password')
        .send({
            password: password,
            confirmpass: confirmpass,
            confirm_key: confirm_key,
            user_id: user_id
        })
        .set('accept', 'application/json')
        .end(callback);
}
