var express = require('express');
var watchmen = require('../lib/watchmen');
var app = express();
var storage_factory = require ('../lib/storage/storage_factory');
var storage = storage_factory.get_storage_instance();
var moment = require ('moment');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var expressLayouts = require('express-ejs-layouts');
var session = require('express-session');

function usePassportAuth (app) {
  var passport = require('passport');
  var GoogleStrategy = require('passport-google').Strategy;

  passport.use(new GoogleStrategy({
      returnURL: 'http://localhost:3000/auth/google/return',
      realm: 'http://localhost:3000/'
    },
    function(identifier, profile, done) {
      done(null, identifier);
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Redirect the user to Google for authentication.  When complete, Google
  // will redirect the user back to the application at
  //     /auth/google/return
  app.get('/auth/google', passport.authenticate('google'));

  // Google will redirect the user to this URL after authentication.  Finish
  // the process by verifying the assertion.  If valid, the user will be
  // logged in.  Otherwise, authentication has failed.
  app.get('/auth/google/return', passport.authenticate('google', {
      successRedirect: '/',
      failureRedirect: '/login' }
  ));
}

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('layout', 'layout.html');


//register .html extension with ejs view render
app.engine('.html', require('ejs').renderFile);
app.use(session({
  secret: 'keyboard cat'
}));
app.use(expressLayouts);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(methodOverride());

usePassportAuth(app);

//-----------------------------------------
// Import routes
//-----------------------------------------
require('./routes/reporting').add_routes(app, storage);

app.use(express.static(__dirname + '/public'));

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}

//-----------------------------------------
// Start server
//-----------------------------------------
var port = parseInt(process.argv[2], 10) || 3000;
var server = app.listen(port, function () {

  if (server.address()) {
    console.log("watchmen server listening on port %d in %s mode", port, app.settings.env);
  } else {
    console.log ('something went wrong... couldn\'t listen to that port.');
    process.exit(1);
  }

  process.on('SIGINT', function () {
    console.log('stopping web server.. bye!');
    server.close();
    process.exit(0);
  });
});
