var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var testing = require('../lib/route/testing.js');
var consts = require('../lib/consts.js');
var validate = require('../lib/validation.js');

function Endpoint(url, methods, roles) {
    this._possible_methods = ["DELETE", "HEAD", "POST", "GET", "PUT", "OPTIONS"];
    this._possible_roles = consts.ROLES_ALL;
    this._url = url;
    this._methods = methods;
    this._roles = roles;
    var validMethods = function(ms) {
        for (var i=0; i<ms.length; i++) {
            if (!this._possible_methods.contains(ms[i]))
                return false;
        }
        return true;
    }
    if (methods.length != roles.length && validMethods(methods))
        throw "Invalid Endpoint"
}

Endpoint.prototype.generateAllPossibleRequests = function() {
    var reqs = [];
    for (var i=0; i<this._possible_methods.length; i++) {
        for (var j=0; j<this._possible_roles.length; j++) {
            reqs.push([this._url, this._possible_methods[i], this._possible_roles[j]]);
        }
    }
    return reqs;
}
Endpoint.prototype.generateAllValidRequests = function() {
    var reqs = [];
    for (var i=0; i<this._methods.length; i++) {
        reqs.push([this._url, this._methods[i], this._roles[i]]);
    }
    return reqs;
}
Endpoint.prototype.getUrl = function() {
    return this._url;
}
Endpoint.prototype.getMethods = function() {
    return this._methods;
}
Endpoint.prototype.getRoles = function() {
    return this._roles;
}
var generateTestUrl = function(url) {
    return url.replace(/:id/i, "abc123")
                    .replace(/:email/i, encodeURI("some.jerk@tufts.edu"))
                    .replace(/:filter/i, encodeURI(JSON.stringify({$in: ['value']})));
}

describe('Tusk Marketplace Whitelist', function() {
    it('Verify Public Listing Endpoints', function(done) {
        var _ = function(url, methods, roles) {
            return new Endpoint(url, methods, roles);
        }
        var all_endpoints = [
            _("/user/:id/listing", ["GET"], [consts.ROLE_MODERATOR_PUBLIC]),
            _("/user/:id/listing/filter/:filter", ["GET"], [consts.ROLE_MODERATOR_PUBLIC]),
            _("/me/listing", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/me/listing/filter/:filter", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing", ["GET", "POST"], [consts.ROLE_INVALID, consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing/:id", ["GET", "POST"], [consts.ROLE_CONFIRMED_PUBLIC, consts.ROLE_CONFIRMED_PUBLIC])
        ];

        for (var i=0; i<all_endpoints.length; i++) {
            var all_reqs = all_endpoints[i].generateAllPossibleRequests();
            var valid_reqs = all_endpoints[i].generateAllValidRequests();
            for (var j=0; j<all_reqs.length; j++) {
                var url = all_reqs[j][0];
                var method = all_reqs[j][1];
                var role = all_reqs[j][2];
                var expect_success = false;

                for (var k=0; k<valid_reqs.length; k++) {
                    var url_chk = url === valid_reqs[k][0];
                    var method_chk = method === valid_reqs[k][1];
                    var priv_chk = consts.checkPriv(role, valid_reqs[k][2]);
                    if (url_chk && method_chk && priv_chk) {
                        expect_success = true;
                        break;
                    }
                }

                var has_permission = testing.hasUrlPermission(t_url, method, role);
                var t_url = generateTestUrl(url);
                if (has_permission != expect_success) {
                    console.log("ERR !"+all_reqs[j]);
                    console.log(t_url);
                }
                expect(has_permission).to.equal(expect_success);
            }
        }

        done();
    });

    it('Verify Public Endpoints', function(done) {
        var _ = function(url, methods, roles) {
            return new Endpoint(url, methods, roles);
        }
        var all_endpoints = [
            _("/user/:id/listing", ["GET"], [consts.ROLE_MODERATOR_PUBLIC]),
            _("/user/:id/listing/filter/:filter", ["GET"], [consts.ROLE_MODERATOR_PUBLIC]),
            _("/user/:id/confirm", ["GET"], [consts.ROLE_INVALID]),
            _("/user/:email/recover", ["POST"], [consts.ROLE_INVALID]),
            _("/me/password", ["PUT"], [consts.ROLE_INVALID]),
            _("/me/register", ["POST"], [consts.ROLE_INVALID]),
            _("/me/resendConfirmation", ["POST"], [consts.ROLE_INVALID]),
            _("/me/login", ["POST"], [consts.ROLE_INVALID]),
            _("/me/logout", ["POST"], [consts.ROLE_INVALID]),
            _("/me/listing", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/me/listing/filter/:filter", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing", ["GET", "POST"], [consts.ROLE_INVALID, consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing/:id", ["GET", "POST"], [consts.ROLE_CONFIRMED_PUBLIC, consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing/:id/approval", ["PUT"], [consts.ROLE_MODERATOR_PUBLIC]),
            _("/listing/:id/quarrentine", ["PUT"], [consts.ROLE_MODERATOR_PUBLIC]),
            _("/listing/:id/flag", ["GET", "POST"], [consts.ROLE_MODERATOR_PUBLIC, consts.ROLE_CONFIRMED_PUBLIC]),
            _("/sign_s3", ["GET"], [consts.ROLE_INVALID]),
            _("/listing/:id/contactSeller", ["POST"], [consts.ROLE_CONFIRMED_PUBLIC])
        ];

        if (all_endpoints.length != testing.WHITELIST.length)
            return done("Not testing all whitelist endpoints!!!");


        for (var i=0; i<all_endpoints.length; i++) {
            var all_reqs = all_endpoints[i].generateAllPossibleRequests();
            var valid_reqs = all_endpoints[i].generateAllValidRequests();
            for (var j=0; j<all_reqs.length; j++) {
                var url = all_reqs[j][0];
                var method = all_reqs[j][1];
                var role = all_reqs[j][2];
                var expect_success = false;

                for (var k=0; k<valid_reqs.length; k++) {
                    var url_chk = url === valid_reqs[k][0];
                    var method_chk = method === valid_reqs[k][1];
                    var priv_chk = consts.checkPriv(role, valid_reqs[k][2]);
                    if (url_chk && method_chk && priv_chk) {
                        expect_success = true;
                        break;
                    }
                }

                var has_permission = testing.hasUrlPermission(t_url, method, role);
                var t_url = generateTestUrl(url);
                if (has_permission != expect_success) {
                    console.log("ERR !"+all_reqs[j]);
                    console.log(t_url);
                }
                expect(has_permission).to.equal(expect_success);
            }
        }

        done();
    });
});
