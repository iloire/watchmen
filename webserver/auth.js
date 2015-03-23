module.exports = (function (){

  return {
    
    /**
     * Configure application with authentication mechanisms
     * @param  {Application} app
     */
    configureApp : function (app){

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