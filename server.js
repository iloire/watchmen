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

var config = require('./config')
	, util = require('util')
	, request = require ('./lib/request')
	, email_service = require ('./lib/email')

var redis = require("redis").createClient(config.database.port, config.database.host);
redis.select (config.database.db);

var services = []
var hosts = require('./config/hosts');

for (var i=0; i<hosts.length;i++){
	for (var u=0;u<hosts[i].urls.length;u++){
		hosts[i].urls[u].host = hosts[i]
		hosts[i].urls[u].url_info = hosts[i].name + ' - ' + hosts[i].host + ':'+ hosts[i].port  + hosts[i].urls[u].url + ' [' + hosts[i].urls[u].method + ']'
		services.push (hosts[i].urls[u]);
	}
}

function log_info (str){ util.puts (str) }

function log_ok (str){ util.puts (str.green) }

function log_error (str){ util.puts (str.red) }

function log_warning (str){ util.puts (str.cyan.bold) }

var WatchMen = require ('./lib/watchmen').WatchMen
var watchmen = new WatchMen(services, redis, request.processRequest);

watchmen.on('service_error', function(service, request_response){
	var url_info = request_response.url_conf.url_info;

	var info = url_info + ' down!. Error: ' + request_response.error + '. Retrying in ' 
		+ request_response.next_attempt_secs / 60 + ' minute(s)..';

	log_error (info); 

	if (request_response.previous_state.status != 1 && config.notifications.Enabled){
		email_service.sendEmail(
			service.alert_to || service.host.alert_to || config.notifications.To,
			url_info + ' is down!', url_info + ' is down!. Reason: ' + error, function (err, data){
				if (err){
					console.error (url_info + ': error sending email: ' + JSON.stringify(err));
				}
			});
	}
	else{
		log_info ('Notification disabled or not triggered this time (site down) for ' + url_info);
	}
})

watchmen.on('service_warning', function(service, request_response){
	console.log('WARNING --------------');
	console.log(service);
})

watchmen.on('service_back', function(service, request_response){
	var url_info = 'this.get_url_info (params.url_conf.host, params.url_conf)'
	if (config.notifications.Enabled){
		email_service.sendEmail(
			service.alert_to || service.host.alert_to || config.notifications.To,
			url_info + ' ' +  service.msg, function(err, data){
				if (err){
					console.error (url_info + ': error sending email: ' + JSON.stringify(err));
				}
			});
	}
	else{
		log_info ('Notification disabled or not triggered this time (site back) for ' + url_info);
	}
})

watchmen.on('service_ok', function(service, request_response){
	var url_info = 'this.get_url_info (params.url_conf.host, params.url_conf)'
	log_ok (url_info + ' responded OK! (' + request_response.elapsed_time + ' milliseconds, avg: ' 
			+ request_response.avg_response_time + ')')
})

watchmen.start();

process.on('uncaughtException', function(err) {
	console.log ('uncaughtException');
  console.log(err);
});


process.on('SIGINT', function () {
	console.log('stopping watchmen..');
	redis.quit();
	process.exit(0);
});