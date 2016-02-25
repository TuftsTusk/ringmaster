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
                    .replace(/:email/i, "some.jerk@tufts.edu");
}

describe('Tusk Marketplace Whitelist', function() {
    it('Verify Public Endpoints', function(done) {
        var _ = function(url, methods, roles) {
            return new Endpoint(url, methods, roles);
        }
        var all_endpoints = [
            _("/user/:id", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/user/:id/confirm", ["GET"], [consts.ROLE_INVALID]),
            _("/user/:email/recover", ["POST"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/me/password", ["PUT"], [consts.ROLE_INVALID]),
            _("/me/register", ["POST"], [consts.ROLE_INVALID]),
            _("/me/login", ["POST"], [consts.ROLE_INVALID]),
            _("/me/logout", ["POST"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/me/listing", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/me/listing/filter/:filters", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing", ["GET", "POST"], [consts.ROLE_INVALID, consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing/:id", ["GET"], [consts.ROLE_CONFIRMED_PUBLIC]),
            _("/listing/:id/approve", ["PUT"], [consts.ROLE_MODERATOR_PUBLIC]),
            _("/listing/:id/quarrentine", ["PUT"], [consts.ROLE_MODERATOR_PUBLIC]),
        ];
        var dev_endpoints = [
            _("/unconf_user/:email", ["DELETE"], [consts.ROLE_ROOT]),
            _("/user/:email", ["DELETE"], [consts.ROLE_ROOT]),
            _("/listing/:id", ["DELETE"], [consts.ROLE_ROOT])
        ];
        all_endpoints = all_endpoints.concat(dev_endpoints);


        for (var i=0; i<all_endpoints.length; i++) {
            var all_reqs = all_endpoints[i].generateAllPossibleRequests();
            var valid_reqs = all_endpoints[i].generateAllValidRequests();
            for (var j=0; j<all_reqs.length; j++) {
                var url = all_reqs[j][0];
                var method = all_reqs[j][1];
                var role = all_reqs[j][2];
                var expect_success = false;
                for (var k=0; k<valid_reqs.length; k++) {
                    if (url === valid_reqs[k][0] &&
                        method === valid_reqs[k][1] &&
                        consts.checkPriv(role, valid_reqs[k][2])) {
                        expect_success = true;
                    }
                }
                
                t_url = generateTestUrl(url);
                console.log(testing.hasUrlPermission(t_url, method, role) + " " + expect_success);
                if (testing.hasUrlPermission(t_url, method, role) != expect_success)
                    console.log("Uh oh! "+t_url+" "+method+" "+role.toString(16));
                expect(testing.hasUrlPermission(t_url, method, role)).to.equal(expect_success);
            }
        }

        done();
    });
});

