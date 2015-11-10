var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
describe('Listing lifecycle', function(){
  console.log(process.env.PORT);
  it('should be able to add a listing', function(done){
    request(app)
      .get('/getListings')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })
});
