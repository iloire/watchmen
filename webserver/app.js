var express = require('express');
var app = module.exports = express.createServer();

var _redis = require("redis")
var redis = _redis.createClient()

var config = require('../config.js')

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
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


function $() { return Array.prototype.slice.call(arguments).join(':') } 

//url log detail
app.get('/log', function(req, res){
	var host = req.query ['host'], url = req.query ['url']

	var logs = [];
	redis.lrange ($(host, url, 'events'), 0, 100, function(err, timestamps) {
		var multi = redis.multi()
		for (i=0;i<timestamps.length;i++)	{
			var key = $(host, url, 'event', timestamps[i]);
			multi.get (key);
		}
		
		multi.exec(function(err, replies) {
			for (i=0;i<replies.length;i++){
				logs.push  (JSON.parse(replies[i]));
			}
			res.render('entry_logs', {title: 'Logs for ' + host + ' ' + url, logs: logs});
		});
	});
	
});

//list of hosts and url's
app.get('/', function(req, res){
	var hosts=config.hosts
	
	var multi = redis.multi()
	for (var i=0; i<hosts.length;i++){
		for (var u=0;u<hosts[i].urls.length;u++){
			multi.get ($(hosts[i].host, hosts[i].urls[u].url, 'lastfailure'));
			multi.get ($(hosts[i].host, hosts[i].urls[u].url, 'lastok'));
		}
	}
	
	multi.exec(function(err, replies) {
		if (err){
			res.end ('something went wrong!'); //todo: err handling
		}
		else{
			var counter=0
			for (i=0;i<hosts.length;i++) {
				for (var u=0;u<hosts[i].urls.length;u++){
					hosts[i].urls[u].lastfailure = replies[counter];
					counter++;
					hosts[i].urls[u].lastok = replies[counter];
					counter++;
				}
			}
			res.render('index', {title:'test', hosts: hosts});
		}
	});
	
});

var port = parseInt(process.argv[2], 10) || 3000
app.listen(port);
console.log("watchmen server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('SIGINT', function () {
	console.log('stopping web server.. bye!');
	redis.quit();
	process.exit(0);
});