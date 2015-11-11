// Plugins
var uuid = require('uuid')
express = require('express'),
path = require('path'),
favicon = require('serve-favicon'),
logger = require('morgan'),
cors = require('cors'),
MongoClient = require('mongodb').MongoClient, format = require('util').format,
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
mongoose = require('mongoose'),
validator = require('validator');
// load Schema
var Listing = require('./models/listing.js')

// Configuration
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');
app.use(cors());

// Database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL|| 'mongodb://localhost/tusk';
mongoose.connect(mongoUri);

app.get('/alive', function(request, response){
  return response.send('yes thank you');
});


app.post('/listing', function(request, response) {
  response.set('Content-Type', 'application/json');
	var uid = uuid.v1();
	var listing = new Listing;
	listing.user_id = 0;
	listing.address = request.body.address;
        listing.date_range = request.body.date_range;
        listing.rent = request.body.rent;
        listing.bedrooms_available = request.body.bedrooms;
        listing.bathrooms = request.body.bathrooms;
        listing.image_gallery_link = ('image_gallery_link' in request.body) ? request.body.image_gallery_link : "";
        listing.est_utilities = ('est_utilities' in request.body) ? request.body.est_utilities : "";
        listing.notes = ('notes' in request.body) ? request.body.notes : "";


	listing.save(function(err){
		if (!err){
			return response.send(JSON.stringify({success: true, message:
				request.protocol + '://' + request.get('host') + '/listing/' + listing._id}));
		} else {
			return response.send({"success": "false", "message":"Invalid elements in body"});
		}
	});
});

app.get('/listing', function(request,response){
  response.set('Content-Type', 'application/json');
	 return Listing.find(function (err, listings) {
	    if (!err){
	      response.send(listings.reverse());
	    } else {
	      response.send('{}');
	    }
	});
});

app.get('/search/:vars/:val', function(request,response){
  response.set('Content-Type', 'application/json');
	var val = request.params.val;
	return Listing.find({_id:val}, function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send('{}');
	    }
	})
});

app.get('/listing/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
	var uid = request.params.uid;
	return Listing.find({_id:uid}, function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send('{}');
	    }
	})
});

app.delete('/listing/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
	var uid = request.params.uid;
	return Listing.findOneAndRemove({_id:uid}).remove(function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send(err);
	    }
	})
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(process.env.PORT || 3000);

module.exports = app;
