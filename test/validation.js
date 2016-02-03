var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
var validate = require('../lib/validation.js');

describe('Validation Library', function() {
    it('Check for present keys', function(done) {
        var testmap = {};
        var keys = ['firstkey', 'key2', 'lastkey'];
        for (i=0; i<keys.length; i++) {
            testmap[keys[i]] = i;
        }
        if (validate.checkForKeys(keys, testmap))
            done();
        else
            done('Key validation failed');
    });

    it('Validate Email Addresses', function(done) {
        var validEmails = [
            'some.email@domain.sub.ext',
            'simple@domain.com'
        ];
        var invalidEmails = [
            'notvalid.domain.com',
            '@domain.com',
            ' white space @domain.com',
            'nodomain@something',
            '!wrong@domain.com',
            'stillwrong@domain..com'
        ];

        var result = true;
        for (i=0; i<validEmails.length; i++) {
            result &= validate.validateEmail(validEmails[i]);
        }
        for (i=0; i<invalidEmails.length; i++) {
            result &= !validate.validateEmail(invalidEmails[i]);
        }
        if (result) done();
        else done('Email validation failed');
    });

    it('Validate Tufts Emails', function(done) {
        var validTuftsEmails = [
            'some.jerk@tufts.edu',
            'some.jerk@cs.tufts.edu',
            'somejerk@tufts.edu',
            'somejerk@eecs.tufts.edu'
        ];
        var invalidTuftsEmails = [
            'some.jerk@domain.edu',
            'somejerk@tufts.com',
            'some.jerk@cs.edu',
            'some.jerk@tufts@edu',
            'some.jerk@tufts$edu'
        ];
        var result = true;
        for (i=0; i<validTuftsEmails.length; i++) {
            result &= validate.validateTuftsEmail(validTuftsEmails[i]);
        }
        for (i=0; i<invalidTuftsEmails.length; i++) {
            result &= !validate.validateTuftsEmail(invalidTuftsEmails[i]);
        }
        if (result) done();
        else done('Email validation failed');
    });

    it('Normalize Emails', function(done) {
        var preNormalizedEmails = [
            'some.jerk@gmail.com',
            'SOME.JERK@googlemail.com',
            'some.jerk@tufts.edu',
            'some.jerk@Yahoo.com'
        ];
        var postNormalizedEmails = [
            'somejerk@gmail.com',
            'somejerk@googlemail.com',
            'some.jerk@tufts.edu',
            'some.jerk@yahoo.com'
        ];
        var result = true;
        for (i=0; i<preNormalizedEmails.length; i++) {
            result &= validate.normalizeEmail(preNormalizedEmails[i]) === postNormalizedEmails[i];
        }
        if (result) done();
        else done('Email normalization failed');
    });
});

