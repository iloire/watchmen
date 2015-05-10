var config = require('../config/web');
var passport = require('passport');
var url = require('url');

var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

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
          passReqToCallback: true,
          callbackURL: url.resolve(config.public_host_name, '/auth/google/callback')
        },
        function(request, accessToken, refreshToken, profile, done) {
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
        scope: 'https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
      }));

      app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: '/'
      }), function(req, res) {
          // successful authentication
          res.redirect('/');
      });
    },

    /**
     * Filter authorized servers according to service's authorization settings
     * @param  {Array} services
     * @param  {String} userId
     * @return {Array} services after authorization filters
     */

    filterAuthorizedServers: function(services, userId) {
      return services.filter(function(service){
        if (!service.restrictedTo){
          return true;
        } else {
          return service.restrictedTo.filter(function(user){
            return user === userId;
          }).length > 0;
        }
      });
    }

  };

}());