var express = require('express');
var app = express();
var moment = require ('moment');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var session = require('express-session');
var compress = require('compression');
var api = require('./routes/api-service-route')
var report = require('./routes/api-report-route')
var web = require('./routes/web-route')
var plugins = require('./routes/api-ping-plugins-route');
var webAuth = require('./routes/web-auth-route');
var tokenAuth = require('./routes/token-auth-route');

exports = module.exports = function(storage){
  if (!storage) {
    throw 'storage is required';
  }

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('.html', require('ejs').renderFile);

  app.use(compress());
  app.use(session({
    secret: 'myBigSecret',
    saveUninitialized: true,
    resave: true
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());

  webAuth.configureApp(app);
  tokenAuth.configureApp(app);

  app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });

  app.use('/api/plugins', plugins.getRoutes());
  app.use('/api/report', report.getRoutes(storage));
  app.use('/api', api.getRoutes(storage));
  app.use('/', web.getRoutes(storage));

  app.use(express.static(__dirname + '/public'));

  if (process.env.NODE_ENV === 'development') {
    console.log('development mode');
    app.use(errorHandler());
  }

  return app;

};