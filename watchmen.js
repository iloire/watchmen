/*
Watchmen, and HTTP nonitor for node.js

Copyright (c) 2011 Ivan Loire (twitter: @ivanloire)

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

var config = require('./config.js')
var http = require('http');
var postmark= require('./postmark');
var sys = require('sys');
var colors = require('colors');

/*write to file*/
function log_to_file (file, str){
	var fs = require('fs');
	fs.open(config.logging.base_path + file, 'a', 0666, function( e, id ) {
	  fs.write( id, '\n' + new Date() + ' ' + str, null, 'utf8', function(){
	    fs.close(id, function(){
	      //console.log('file closed');
	    });
	  });
	});
}
 
function processRequest (url_conf, callback){

	// record start time
	var startTime = new Date();
	
	var headers = {
	    'Host': url_conf.host.host
	};
	
	if (url_conf.method == 'post'){
		headers['Content-Type'] = url_conf.content_type
		headers['Content-Length'] = JSON.stringify(url_conf.input_data || '').length
	}
	
	var client = http.createClient(url_conf.host.port || 80, url_conf.host.host);
	var request = client.request(url_conf.method, url_conf.url, headers);
	
	client.addListener('error', function(connectionException){
		callback(connectionException.errno || 'Error establishing connection' , null, null);
		log_error ('Error: ' + connectionException)
	});
	
	request.on('response', function(response) {
		response.setEncoding('utf-8');
		var body = '';
		
		response.on('data', function(chunk) {
			body += chunk;
		});
	
		response.on('end', function() {
			var timeDiff = (new Date() - startTime) / 1000;
			callback(null, body, response, timeDiff)
		});
		
		response.on('error', function(e) {
			log_error ('Error on response :' + url_conf.host)
			callback(e.message, null, null, null)
		});
	});
	
	request.on('error', function(e) {
		log_error ('Error on request :' + url_conf.host)
		callback(e.message, null, null, null)
	});
	
	request.write(JSON.stringify(url_conf.input_data) || '');
	request.end();
}

function log_info (str){ sys.puts (str) }
function log_ok (str){ sys.puts (str.green) }
function log_error (str){ sys.puts (str.red) }
function log_warning (str){ sys.puts (str.cyan.bold) }

function sendEmail (to, subject, body){
	postmark.sendEmail(
	{
		'From' : config.notifications.postmark.From,
		'To': to,
		'Subject': subject,
		'TextBody': body }, config.notifications.postmark.Api_key, function(err, data) {

		if (err) {
			log_error('Error sending email: ' + JSON.stringify(err))
		} else {
			log_ok('Email sent successfully')
		}
	})
}

function query_url(url_conf){
	var host_conf = url_conf.host
	var url_info = host_conf.host + ':'+ host_conf.port  + url_conf.url + ' [' + url_conf.method + ']'
	processRequest(url_conf, function(request_err, body, response, elapsed_time){
		var error, next_attempt_secs
		if (!request_err){ //request completed successfully
			if (response.statusCode != url_conf.expected.statuscode){
				error = 'FAILED! expected status code :' + url_conf.expected.statuscode + ' at ' + url_conf.url + ' but got ' + response.statusCode
			}
			else if (url_conf.expected.contains && body.indexOf(url_conf.expected.contains)==-1){
				error = 'FAILED! expected text "' + url_conf.expected.contains + '" but it wasn\'t found'
			}
		}
		else //error processing request. host down, dns resolution problem, etc..
			error = 'Connection error when processing request: ' + request_err
		
		if (error){ //site down
			if (url_conf.attempts==undefined){
				url_conf.attempts = 1
				url_conf.down_timestamp = new Date()
			}
			else if (url_conf.attempts < (url_conf.retry_in || url_conf.host.retry_in).length){
				url_conf.attempts++;
			}
			
			if ((url_conf.attempts >= (url_conf.notify_after_failed_ping || host_conf.notify_after_failed_ping)) && config.notifications.Enabled){
				sendEmail(
					host_conf.alert_to || config.notifications.To, 
					url_info + ' is down!', url_info + ' is down!. Reason: ' + error);
			} else{
				log_info ('Notification disabled or not triggered this time');
			}
			
			next_attempt_secs = (url_conf.retry_in || url_conf.host.retry_in) [url_conf.attempts-1] * 60;
			var info = url_info + ' down!. Error: ' + error + '. Retrying in ' + next_attempt_secs / 60 + ' minute(s)..';
			if (config.logging.Enabled)
				log_to_file(url_conf.host.name + '.log', info)
			log_error (info)
		}
		else { //site up. queue next ping
			next_attempt_secs = url_conf.ping_interval || url_conf.host.ping_interval;
			if (url_conf.attempts){ //site was down and now it is up again!
				url_conf.attempts = undefined
				var info = url_info + ' is back!. Downtime: ' + (new Date() - url_conf.down_timestamp) / 1000 + ' seconds.'; 
				if (config.notifications.Enabled){
					sendEmail(
						host_conf.alert_to || config.notifications.To,
						url_info + ' is back up!', info);
				}

				if (config.logging.Enabled)
					log_to_file(url_conf.host.name + '.log', info)
				log_warning (info)
			}
			else{ //site up
				log_ok (url_info + ' responded OK! (' + elapsed_time + ' secs)')
			}
		}
		
		setTimeout (query_url, next_attempt_secs * 1000, url_conf);	
	})
}

/*main*/

log_info ('\nstarting watchmen...')
log_info ('reading configuration and queuing hosts for pinging...')

for (var i=0; i<config.hosts.length;i++){
	var host = config.hosts[i];
	if (host.enabled){
		log_info ('monitoring ' + host.name + ':')
		for (var u=0;u<config.hosts[i].urls.length;u++){
			if (host.urls[u].enabled != false){
				host.urls[u].host = host
				var ping = host.urls[u].ping_interval || host.ping_interval
				log_info (' -- queuing "' + host.urls[u].url + '".. ping every ' + ping + ' seconds...')
				setTimeout (query_url, ping * 1000, host.urls[u]);
			}
			else{
				log_warning (' -- skipping url: ' + host.name + host.urls[u].url + ' (disabled entry)...')
			}
		}
	}
	else{
		log_warning ('skipping host: ' + host.name + ' (disabled entry)...')
	}
}
