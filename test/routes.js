var assert = require('assert');
var request = require('supertest');
//sample test
describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    });
  });
});
describe('GET /listing', function(){
  console.log(process.env.PORT);
  it('should respond with json', function(done){
    request('http://localhost:3000/listing')
      .get('/listing')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })
});
