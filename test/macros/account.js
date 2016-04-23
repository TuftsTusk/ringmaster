var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../../app.js');
var m_user = require('../../lib/models/user.js');
var m_unconf_user = require('../../lib/models/unconf_user.js');

exports.deleteWithEmail = function(email, callback) {
    m_user.findOneAndRemove({email:email}, function(err, user) {
        var _status =(!err && user) ? 204 : 500;
        callback(err, {"status" : _status});
    });
};

exports.deleteUnconfWithId = function(id, callback) {
    m_unconf_user.findOneAndRemove({_id:id}, function(err, user) {
        var _status =(!err && user) ? 204 : 500;
        callback(err, {"status" : _status});
    });
};

exports.deleteUnconfWithEmail = function(email, callback) {
    m_unconf_user.findOneAndRemove({email:email}, function(err, user) {
        var _status =(!err && user) ? 204 : 500;
        callback(err, {"status" : _status});
    });
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

exports.resendConfirmation = function(email, callback) {
    request(app)
        .post('/me/resendConfirmation')
        .send({
            email: email
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
