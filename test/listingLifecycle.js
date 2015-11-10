var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
describe('Listing lifecycle', function(){
  console.log(process.env.PORT);
  it('should be able to add a listing', function(done){
    request(app)
      .post('/addListing')
      .send({name:"test",description:"bike",user:"ci-test",price:"100",imageURL:"www.google.com"})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) done(err);
        console.log(res.body);
        var body = JSON.parse(res.body);
        expect(body.success).to.contain('true');
        //res.body.success.should.equal('true');
        done();
      });
  });
});
