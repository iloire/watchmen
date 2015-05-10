var express = require('express');
var app = express();
var storageFactory = require ('../lib/storage/storage-factory');
var storage = storageFactory.getStorageInstance('development'); // TODO according to env
var moment = require ('moment');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var session = require('express-session');
var compress = require('compression');
var api = require('./routes/service-route')
var report = require('./routes/report-route')
var web = require('./routes/web-route')

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

require('./../lib/auth').configureApp(app);

//-----------------------------------------
// Import routes
//-----------------------------------------
app.use('/api/report', report.getRoutes(storage));
app.use('/api', api.getRoutes(storage));
app.use('/', web.getRoutes(storage));

app.use(express.static(__dirname + '/public'));

if (process.env.NODE_ENV === 'development') {
  console.log('development mode');
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
