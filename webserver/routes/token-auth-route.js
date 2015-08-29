var passport = require('passport');
var config = require('../../config/web');
var securityHelper = require('./helpers/security');

var GoogleTokenStrategy = require( 'passport-google-token' ).Strategy;

module.exports = (function (){

  return {

    /**
     * Configure application to authenticate with a google token
     * @param  {Application} app
     */

    configureApp : function (app){

      passport.use(new GoogleTokenStrategy({
          clientID: config.auth.GOOGLE_CLIENT_ID,
          clientSecret: config.auth.GOOGLE_CLIENT_SECRET,
        },
        function(accessToken, refreshToken, profile, done) {
          var email = profile.emails[0].value;
          done(null, {
            email : email,
            emailHash: securityHelper.md5(email),
            isAdmin: securityHelper.isAdmin(email)
          });
        }
      ));

      app.post('/auth/google/token', passport.authenticate('google-token'), function (req, res) {
        res.send(req.user);
      });
    }
  };

}());
