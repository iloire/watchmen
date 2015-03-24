var config = require('../config/general');
var passport = require('passport');
var url = require('url');

var GoogleStrategy = require('passport-google').Strategy;

module.exports = (function (){

  return {
    
    /**
     * Configure application with authentication mechanisms
     * @param  {Application} app
     */
    configureApp : function (app){

      passport.use(new GoogleStrategy({
          returnURL: url.resolve(config.public_host_name, '/auth/google/return'),
          realm: config.public_host_name
        },
        function(identifier, profile, done) {
          done(null, profile.emails[0].value);
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

      app.get('/login', function(req, res) {
        res.render('login.html', {
          title: 'Login'
        });
      });

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
    },

    /**
     * Filter authorized servers according to service's authorization settings
     * @param  {String} userId
     * @param  {Array} services 
     * @return {Array} services after authorization filters
     */
    filterAuthorizedServers: function(services, req) {
      return services.filter(function(service){
        if (!service.restrictedTo){
          return true;
        } else {
          return service.restrictedTo.filter(function(user){
            return user === req.user;
          }).length > 0;
        }
      });
    },

    /**
     * Authentication middleware
     * @param  {Request}   req
     * @param  {Response}   res
     * @param  {Function} next
     */
    ensureAuthenticated: function(req, res, next) {
      if (req.isAuthenticated()) { return next(); }
      res.redirect('/login');
    }
  };

}());