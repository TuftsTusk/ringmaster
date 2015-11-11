var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
//sample test
describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});

//routes test
describe('GET /listing', function(){
  it('should respond with json', function(done){
    request(app)
      .get('/listing')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })
});
