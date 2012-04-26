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
var config = require('../config')
var redis = require("redis").createClient(config.database.port, config.database.host);
redis.select (config.database.db);

var util = require('../lib/util')
var watchmen = require('../lib/watchmen')
var reports = require('../lib/reports')

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

//url log detail
app.get('/log', function(req, res){
	var max = 100;
	reports.get_reports_by_host (redis, req.query['url'], req.query['host'], req.query['port'], function (err, data){
		if (err){
			return res.end(err)
		}
		console.log(data);
		res.render("entry_logs.html", data);
	})
});

//list of hosts and url's
app.get('/', function(req, res){
	res.render('index.html', {title: 'watchmen'});
});


app.get('/getdata', function(req, res){
	reports.get_hosts(redis, config.hosts, function (err, hosts){
		return res.json ({hosts:hosts, timestamp: util.extraTimeInfo(new Date().getTime())})
	})
});

var port = parseInt(process.argv[2], 10) || 3000
app.listen(port);
if (app.address())
	console.log("watchmen server listening on port %d in %s mode", app.address().port, app.settings.env);
else
	console.log ('something went wrong... couldn\'t listen to port?')

process.on('SIGINT', function () {
	console.log('stopping web server.. bye!');
	redis.quit();
	process.exit(0);
});