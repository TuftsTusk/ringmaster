var expect = require('expect.js');
var assert = require('assert');
var request = require('supertest');
var app = require('../app.js');
describe('Listing lifecycle', function(){
  it('Fail to add a listing with no data', function(done){
    request(app)
      .post('/listing')
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if (err) done(err);
        //var body = JSON.parse(res.text);
        var body = res.body;
        expect(body.success).to.equal(false);
        done();
      });
  });

  it('Successfully add and remove a single listing', function(done) {
    var deleteWithID = function(id) {
        request(app)
            .del('/listing/'+id)
            .send({})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) done(err);
                done();
            });
    };
    
    request(app)
        .post('/listing')
        .send({
            address: "587 Boston Ave., Somerville MA 02144",
            date_range: "2015-08-02,2016-08-02",
            rent: 750,
            bedrooms_available: 5,
            bathrooms: 3,
            image_gallery_link: "img link hurrdurr",
            est_utilities: 100,
            pre_furnished: true,
            notes: "Some notes here!"
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .end(function(err, res) {
            if (err) done(err);
            var body = res.body;
            expect(body.success).to.equal(true);
            deleteWithID(body.rsc_id);
        });
  });
});
