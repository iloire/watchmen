var express = require('express');
var watchmen = require('../lib/watchmen');
var app = express();
var storage_factory = require ('../lib/storage/storage_factory');
var storage = storage_factory.get_storage_instance();
var moment = require ('moment');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');
var session = require('express-session');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//register .html extension with ejs view render
app.engine('.html', require('ejs').renderFile);
app.use(session({
  secret: 'keyboard cat'
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(methodOverride());

require('./auth').configureApp(app);

//-----------------------------------------
// Import routes
//-----------------------------------------
require('./routes/web').add_routes(app);
require('./routes/service').add_routes(app, storage);

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
