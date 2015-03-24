var config = require('../config/general');
var passport = require('passport');
var url = require('url');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = (function (){

  return {
    
    /**
     * Configure application with authentication mechanisms
     * @param  {Application} app
     */
    configureApp : function (app){

      passport.use(new GoogleStrategy({
          clientID: config.auth.GOOGLE_CLIENT_ID,
          clientSecret: config.auth.GOOGLE_CLIENT_SECRET,
          callbackURL: url.resolve(config.public_host_name, '/auth/google/callback')
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

      app.get('/auth/google', passport.authenticate('google', {
        scope: 'https://www.google.com/m8/feeds'
      }));

      app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: '/login'
      }), function(req, res) {
          // Successful authentication, redirect home.
          res.redirect('/');
      });
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