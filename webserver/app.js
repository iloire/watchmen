var express = require('express');
var watchmen = require('../lib/watchmen');
var app = express.createServer();
var config = require('../config');
var storage_factory = require ('../lib/storage/storage_factory');
var storage = storage_factory.get_storage_instance();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.register('.html', require("ejs")); //register .html extension with ejs view render
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

//-------------------------------
// Url log detail
//-------------------------------
app.get('/details', function(req, res){
	var max = 100;
	var host = req.query ['host'], url = req.query ['url'], port = req.query['port'];
	var service = require ('../lib/services').load_services().filter(function(service){
		return (service.host.host == host && service.url == url && service.host.port == port);
	});
	if (!service.length){
		return res.end('not found');
	}

	storage.report_one(service[0], function (err, service){
		res.render('details.html', {
			title: service.url_info,
			service: service,
			critical_events: service.data.events.filter(function(item){return item.type == 'critical';}),
			warning_events: service.data.events.filter(function(item){return item.type == 'warning';})
		});
	});
});

//-------------------------------
// List of hosts and url's
//-------------------------------
app.get('/', function(req, res){
	res.render('list.html', {title: 'watchmen'});
});

//-------------------------------
// Get list (JSON)
//-------------------------------
app.get('/getdata', function(req, res){
	var services = require ('../lib/services').load_services();
	storage.report_all(services, function (err, data){
		res.json(data);
	});
});

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