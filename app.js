var uuid = require('uuid');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cors = require('cors');
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var app = express();


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');

// Mongo initialization and connect to database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL|| 'mongodb://localhost/tusk';
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

//enable CORS
app.use(cors())



app.get('/', function(request, response){
  response.send('Hey there buddy!');
})

app.post('/addListing', function(request, response) {
  response.set('Content-Type', 'application/json');
	var name = request.body.name;
	var description = request.body.description;
  var price = request.body.price;
  var user = request.body.user;
  var image = request.body.image;
  var date = new Date();
  var uid = uuid.v1();
  db.collection('tusk', function(error1, coll) {
    if (!name || !description || !price || !name || !image || !user ) {
      response.send(JSON.stringify({success: false, message:
                      'Invalid elements in body'}));
    } else {
      var listing = coll.insert({uid:uid,
                                name:name,
                                image: image,
                                description:description,
                                user: user,
                                price: price,
                                created_at: date}, function(error, saved) {
                                  response.send(JSON.stringify({success: true, message:
                                    request.protocol + '://' + request.get('host') + '/getListings/' + uid}));
      });
    }
  });
});

app.get('/getListings', function(request,response){
  response.set('Content-Type', 'application/json');
	db.collection('tusk').find().toArray(function(error, listings) {
    if (listings){
      response.send(listings.reverse());
    } else {
      response.send('{}');
    }
	});
});

app.get('/getListings/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
  var uid = request.params.uid;
	db.collection('tusk').find({uid: uid}).toArray(function(error, listings) {
    if (listings){
      response.send(listings);
    } else {
      response.send('{}');
    }
	});
});

app.delete('/getListings/:uid', function(request,response){
  response.set('Content-Type', 'application/json');
  var uid = request.params.uid;
	db.collection('tusk').remove({uid: uid}, function(error, num) {
    if (error){
      response.send(JSON.stringify(error));
    } else {
      response.send(JSON.stringify(num));
    }
	});
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
