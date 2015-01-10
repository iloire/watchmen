var express = require('express');
var watchmen = require('../lib/watchmen');
var app = express.createServer();
var storage_factory = require ('../lib/storage/storage_factory');
var storage = storage_factory.get_storage_instance();
var moment = require ('moment');
var passport = require('passport')
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

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.register('.html', require("ejs")); //register .html extension with ejs view render
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'sdf@#$$%^23423'}));
  app.use(express.methodOverride());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
app.get('/auth/google/return', 
  passport.authenticate('google', { successRedirect: '/',
                                    failureRedirect: '/login' }));

//-----------------------------------------
// Import routes
//-----------------------------------------
require('./routes/reporting').add_routes(app, storage);

var helpers = {
    dateformat : function (req, res) {
    return function (date, format) {
      if (format==='ago'){
        return moment(date).fromNow();
      }
      else{
        return moment(date).format(format || 'MMM D YYYY, hh:mm');
      }
    };
  }
};

app.dynamicHelpers(helpers);

//-----------------------------------------
// Start server
//-----------------------------------------
var port = parseInt(process.argv[2], 10) || 3000;
app.listen(port);
if (app.address())
  console.log("watchmen server listening on port %d in %s mode", app.address().port, app.settings.env);
else
  console.log ('something went wrong... couldn\'t listen to that port.');

process.on('SIGINT', function () {
  console.log('stopping web server.. bye!');
  process.exit(0);
});