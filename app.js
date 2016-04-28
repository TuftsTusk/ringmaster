// Plugins
var uuid = require('uuid')
express = require('express'),
path = require('path'),
favicon = require('serve-favicon'),
logger = require('morgan'),
cors = require('cors'),
MongoClient = require('mongodb').MongoClient,
format = require('util').format,
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
mongoose = require('mongoose'),
bcrypt = require('bcrypt-nodejs'),
mailer = require('nodemailer');
aws = require('aws-sdk');
utf8 = require('utf8');

// Tusk Libraries
var Consts = require('./lib/consts.js');

// Load Middleware
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');

// Tusk Routes
var UserRoutes = require('./lib/route/user.js');
var ListingRoutes = require('./lib/route/listing.js');
var TestingRoutes = require('./lib/route/testing.js');

/* Possible values:
 *   undefined - NODE_ENV is not set. This should be treated as a FATAL error.
 * development - Development environment, enable debug logging, etc.
 *     staging - Staging server, perhaps allowing additional test code or authentication.
 *  production - Live, production environment that is public-facing. No debug output!
 */
if (Consts.ENV < 0) {
    if (Consts.ENV === Consts.UNDEF)
        console.log("NODE_ENV variable not set. App will not execute until it is assigned a value.");
    if (Consts.ENV === Consts.UNKWN)
        console.log("NODE_ENV variable assigned to an unrecognized value.");
    console.log("Possible values: development, staging, production");
    process.exit(1);
}

var whitelist = ['http://localhost:8080', 'https://tuskdumbo.herokuapp.com', 'http://tuskmarketplace.com', 'https://tuskmarketplace.com', 'https://tuskdumbostaging.herokuapp.com'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  }
};
app.use(cors({credentials: true, origin: true}));

app.options('*', cors(corsOptions));

// Session related plugins
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

// Database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/tusk';
mongoose.connect(mongoUri);

app.use(session({
    secret: Consts.COOKIE_SECRET,
    cookie: {
        expires: Consts.genDefaultExpires(),
        maxAge: Consts.getDefaultMaxAge()
    },
    name: 'sid',
    saveUninitialized: false,
    resave: true,
    rolling: true,
    unset: 'destroy',
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.use(TestingRoutes.ensureEnv);

app.get ('/user/:user_id/confirm', UserRoutes.getUserConfirmById);
app.post('/user/:email/recover', UserRoutes.postUserRecoverByEmail);
app.get ('/user/:user_id/listing', ListingRoutes.getListingByUserId);

app.post('/me/register', UserRoutes.postMeRegister);
app.post('/me/logout', UserRoutes.postMeLogout);
app.post('/me/login', UserRoutes.postMeLogin);
app.post('/me/resendConfirmation', UserRoutes.postMeResendConfirmation);
app.put ('/me/password', UserRoutes.putMyPassword);
app.get ('/me/listing', ListingRoutes.getMeListing);

app.get('/sign_s3', function(req, res){
    var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
    var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
    var S3_BUCKET = process.env.S3_BUCKET;
    aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});
    var s3 = new aws.S3();
    var s3_params = {
        Bucket: S3_BUCKET,
        Key: uuid.v4(),
        Expires: 60,
        ContentType: req.query.file_type,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3_params, function(err, data){
        if(err || !data){
            return res.status(500).send('AWS authentication Failure');
        }
        res.write(data);
        res.end();
    });
});

app.route('/listing/:listing_id')
    .get(ListingRoutes.getListingById)
    .post(ListingRoutes.postListingById);
app.put('/listing/:listing_id/:listing_attr', ListingRoutes.putListingAttributeById);
app.route('/listing')
    .post(ListingRoutes.postListing)
    .get(ListingRoutes.getListing);
    app.route('/listing/:listing_id/contactSeller')
        .post(ListingRoutes.contactListingSeller);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
if (Consts.ENV === Consts.DEV || Consts.ENV === Consts.STG) {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

app.listen(process.env.PORT || 80);

module.exports = app;
