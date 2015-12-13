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
validator = require('validator'),
bcrypt = require('bcrypt-nodejs'),
mailer = require('nodemailer');

// Session related plugins
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// load Schema
var Listing = require('./models/listing.js');
var User = require('./models/user.js');

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

var checkForKeys = function(keys, variable) {
    if (keys instanceof Array) {
        for (i=0; i<keys.length; i++) {
            if (!(keys[i] in variable))
                return false;
        }
        return true;
    }
    return false;
}

function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

function validateTuftsEmail(email) {
    var re = /^.*@(\w+\.)?tufts.edu$/i;
    return validateEmail(email) && re.test(email);
}

app.use(session({
    secret: 'foo',
    saveUninitialized: false,
    resave: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.post('/user/register', function(request, response) {
    response.set('Content-Type', 'application/json');
    if (!checkForKeys(["email", "password", "confirmpass"], request.body)) {
        return response.send(JSON.stringify({success: false, message: "One or more of the registration fields was missing"}));
    } else {
        var email = request.body.email;
        if (!validateTuftsEmail(email)) {
            return response.send({success: false, message: "Email must be a tufts email"});
        } else {
            User.findOne({email:email}, function(err, user) {
                if (user) {
                    return response.send({success: false, message: "Email is already in use"});
                }
                var password = request.body.password;
                if (password != request.body.confirmpass) {
                    return response.send({success: false, message: "Passwords did not match"});
                } else {
                    var newuser = new User;

                    newuser.email = request.body.email;

                    var salt = bcrypt.genSaltSync(10);

                    newuser.passwordSalt = salt;
                    newuser.passwordHash = bcrypt.hashSync(password, salt);

                    //TODO: Generate and send confirmation email
                    //      also create a new model for an unconfirmed user
                    
                    newuser.save(function(err) {
                        if (!err) {
                            return response.send(JSON.stringify({success: true, email: newuser.email}));
                        } else {
                            return response.send(JSON.stringify({success: false, message: err}));
                        }
                    });
                }
            });
        }
    }
});

// for debug only!!! not a real endpoint!
app.delete('/user/:email', function(request, response) {
    response.set('Content-Type', 'application/json');
    User.find({email:request.params.email}, function(err, user) {
        if (err) {
            return reponse.send(JSON.stringify({success: false}));
        } else {
            User.findOneAndRemove({email:request.params.email}, function(err) {
                if (err) {
                    return response.send(JSON.stringify({success: false, message:err}));
                } else {
                    return response.send(JSON.stringify({success: true}));
                }
            });
        }
    });
});

app.post('/user/login', function(request, response) {
    response.set('Content-Type', 'application/json');
    if ("login" in request.session && "tries" in request.session.login) {
        var diff = Date.now() - request.session.login.when;
        if (diff > (3 * 60 * 1000))
            delete request.session.login;
        else if (request.session.login.tries > 5) {
            return response.send(JSON.stringify({success: false, message: "Too many login attempts. Wait a few minutes and try again."}));
        }
    }
    User.findOne({email:request.body.email}, function(err, user) {
        if (err) {
            reponse.send(JSON.stringify({success: false, message: err}));
        } else {
            if (user && bcrypt.hashSync(request.body.password, user.passwordSalt) === user.passwordHash) {
                request.session.login = {valid: true, when: Date.now()};
                return response.send(JSON.stringify({success: true, message: "Logged in successfully"}));
            } else {
                var t = (request.session.login != undefined && "tries" in request.session.login)?(request.session.login.tries+1):1;
                request.session.login = {valid: false, tries: t, when: Date.now()};
                return response.send(JSON.stringify({success: false, message: "Email/password combo was incorrect"}));
            }
        }
    });
});

app.get('/alive', function(request, response){
  return response.send('yes thank you');
});

app.route('/listing')
    .post(function(request, response) {
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
            if (!err) {
                return response.send(JSON.stringify({success: true, rsc_id: listing._id}));
            } else {
                return response.send(JSON.stringify({success: false, message:err}));
            }
        });
    })
    .get(function(request,response){
      response.set('Content-Type', 'application/json');
         return Listing.find(function (err, listings) {
            if (!err){
              return response.send(listings.reverse());
            } else {
              return response.send('{}');
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
	});
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
	});
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

app.listen(process.env.PORT || 3000);

module.exports = app;
