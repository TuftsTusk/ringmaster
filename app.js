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
mongoose = require('mongoose');
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


app.get('/', function(request, response){
  response.send('Hey there bud!');
});



app.post('/addListing', function(request, response) {
  response.set('Content-Type', 'application/json');
	var uid = uuid.v1();
	var listing = new Listing;
	listing.uuid = uid;
	listing.name = request.body.name;
	listing.description = request.body.description;
	listing.user = request.body.user;
	listing.price = request.body.price;
	listing.imageURL = request.body.image;

	listing.save(function(err){
		if (!err){
			return response.send(JSON.stringify({success: true, message:
				request.protocol + '://' + request.get('host') + '/getListings/' + uid}));
		} else {
			return response.send(JSON.stringify({success: false, message:
                      'Invalid elements in body'}));
		}
	});
});

app.get('/getListings', function(request,response){
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
	var vars = "uuid";
	var val = request.params.val;
	return Listing.find({uuid:val}, function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send('{}');
	    }
	})
});

app.get('/getListings/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
	var uid = request.params.uid;
	return Listing.find({uuid:uid}, function (err, listing) {
	    if (!err){
	      response.send(listing);
	    } else {
	      response.send('{}');
	    }
	})
});

app.delete('/getListings/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
	var uid = request.params.uid;
	return Listing.findOneAndRemove({uuid:uid}).remove(function (err, listing) {
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

app.listen(process.env.PORT || 8080);

module.exports = app;
