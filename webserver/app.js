/*
Watchmen, and HTTP monitor for node.js

Copyright (c) 2011 Ivan Loire (twitter: @ivanloire) www.iloire.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

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

	var logs_warning = [];
	var logs_critical = [];
	
	redis.lrange ($(host, url, 'events'), 0, 100, function(err, timestamps) {
		var multi = redis.multi()
		for (i=0;i<timestamps.length;i++)	{
			var key = $(host, url, 'event', timestamps[i]);
			multi.get (key);
		}
		
		multi.get ($(host, url, 'status'));
		
		multi.exec(function(err, replies) {
			for (i=0;i<(replies.length-1);i++){
				if (!replies[i]){
					redis.lrem ($(host, url, 'events'), 1, timestamps[i]) //event has expired. removing from list.
				}
				else{
					var _event = JSON.parse(replies[i]);
					if (_event.event == 'warning'){
						logs_warning.push  (_event);
					}
					else
						logs_critical.push  (_event);
				}
			}
			var status = replies[replies.length-1];
			
			console.log (status)
			
			res.render('entry_logs', {title: host + ' ' + url, status : status, logs_warning: logs_warning, logs_critical: logs_critical});
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
			multi.get ($(hosts[i].host, hosts[i].urls[u].url, 'lastwarning'));
			multi.get ($(hosts[i].host, hosts[i].urls[u].url, 'avg_response_time'));
			multi.get ($(hosts[i].host, hosts[i].urls[u].url, 'status'));
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
					hosts[i].urls[u].lastwarning = replies[counter];
					counter++;
					hosts[i].urls[u].avg_response_time = replies[counter];
					counter++;
					
					if (hosts[i].urls[u].enabled==false || hosts[i].enabled==false)
						hosts[i].urls[u].status = null; //mark as disabled
					else
						hosts[i].urls[u].status = replies[counter];

					counter++;
				}
			}
			res.render('index', {title:'List of hosts', hosts: hosts});
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