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
var postmark = require('./postmark')
var sys = require('util')
var colors = require('colors')
var config = require ('../config')
var util = require ('./util')
var email_service = require ('./email')

function log_info (str){ sys.puts (str) }
exports.log_info = log_info

function log_ok (str){ sys.puts (str.green) }
exports.log_ok=log_ok

function log_error (str){ sys.puts (str.red) }
exports.log_error=log_error

function log_warning (str){ sys.puts (str.cyan.bold) }
exports.log_warning=log_warning

function $() { return Array.prototype.slice.call(arguments).join(':') }

var current_requests = 0

function get_url_info (host_conf, url_conf){
	return host_conf.name + ' - ' + host_conf.host + ':'+ host_conf.port  + url_conf.url + ' [' + url_conf.method + ']'
}

function get_hosts (redis, hosts, callback){
	var multi = redis.multi()
	for (var i=0; i<hosts.length;i++){
		for (var u=0;u<hosts[i].urls.length;u++){
			var key = $(hosts[i].host, hosts[i].port, hosts[i].urls[u].url, 'status');
			multi.hgetall (key);
		}
	}
				
	function ISODateOrEmpty (date){
		return date ? new Date(parseFloat(date)).toISOString() : "";
	}
	
	multi.exec(function(err, replies) {
		if (err){
			return callback (err);
		}

		var counter=0
		for (i=0;i<hosts.length;i++) {
			//remove unused host fields
			delete hosts[i].alert_to
			for (var u=0;u<hosts[i].urls.length;u++){
				//remove unused url fields
				delete hosts[i].urls[u].expected
				delete hosts[i].urls[u].method
				
				var status = replies[counter];

				//config 
				hosts[i].urls[u].ping_interval = hosts[i].urls[u].ping_interval || hosts[i].ping_interval 
				hosts[i].urls[u].warning_if_takes_more_than = hosts[i].urls[u].warning_if_takes_more_than || hosts[i].warning_if_takes_more_than || 0

				hosts[i].urls[u].avg_response_time = Math.round(status.avg_response_time) || null;
				
				if (!(hosts[i].urls[u].enabled==false || hosts[i].enabled==false)){ //enabled
					hosts[i].urls[u].status = (status.status==0) ? "error" : "ok" ; //will show green while collecting data
				}
				else{
					hosts[i].urls[u].status = "disabled";
				}
				
				hosts[i].urls[u].lastfailure = (status && status.lasterror) ? ISODateOrEmpty(status.lasterror) : null;
				hosts[i].urls[u].lastfailuretime = (status && status.lasterror) ? util.extraTimeInfo(status.lasterror) : null;
				
				hosts[i].urls[u].lastok = (status && status.lastok) ? ISODateOrEmpty(status.lastok) : null;
				hosts[i].urls[u].lastoktime = (status && status.lastok) ? util.extraTimeInfo(status.lastok) : null;

				hosts[i].urls[u].lastwarning = (status && status.lastwarning) ? ISODateOrEmpty(status.lastwarning) : null;
				hosts[i].urls[u].lastwarningtime = (status && status.lastwarning) ? util.extraTimeInfo(status.lastwarning) : null;

				counter++;
			}
		}
		callback(err, hosts)
	});	
}
exports.get_hosts = get_hosts


function get_url_status (url_conf, redis, callback) {
	redis.hgetall ($(url_conf.host.host, url_conf.host.port, url_conf.url, 'status'), callback);
}

/*
	- status: 1 = ok, 0 = error
*/
//url_conf, status, msg, event_type, request_status
function update_status(redis, params, callback){
	if (!params.url_conf || !params.request_status || !params.request_status.timestamp){
		return callback ('bad parameters');
	}

	params.event_type = (params.request_status.status) ? 'success' : 'error';

	var minute_time_stamp = util.get_minute_str(params.request_status.timestamp);
	var hour_time_stamp = util.get_hour_str(params.request_status.timestamp);

	var url_key_prefix = $(params.url_conf.host.host, params.url_conf.host.port, params.url_conf.url);

	redis.zscore ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'avg_response_time'), hour_time_stamp, function (err, avg_hour){
		if (err) return callback (err);

		redis.get ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'avg_response_time', hour_time_stamp, 'counter'), function (err, counter){
			if (err) return callback (err);

			var multi = redis.multi()

			//save events
			for (var i = 0, l = params.request_status.events.length; i < l ;  i++) {
				var event_obj = {timestamp : params.request_status.timestamp, event_type: params.request_status.events[i].type, msg : params.request_status.events[i].msg }
				multi.lpush($(url_key_prefix, 'events', params.request_status.events[i].type), JSON.stringify(event_obj));
			};

			//update status
			var key_status = $(url_key_prefix, 'status');

			multi.hmset(key_status, 'status', params.request_status.status); 
			multi.hmset(key_status, 'last' + params.event_type, params.request_status.timestamp); 

			if (params.event_type == 'success') {

				//todo: se puede calcular el glboal avg sin tener que calcular aparte, sino cogiendo los último min??
				//global avg
				multi.hmset(key_status, 'avg_response_time', params.request_status.avg_response_time);
				multi.hincrby(key_status, 'responses_count',1); //so we can calculate avg of all requests

				//calc avg response time per hour
				avg_hour = Math.round(((avg_hour || 0) * parseInt(counter || 0) 
							+ params.request_status.elapsed_time) / (parseInt(counter || 0) + 1));

				multi.incr ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'avg_response_time', hour_time_stamp, 'counter'));
				multi.zadd ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'avg_response_time'), avg_hour, hour_time_stamp);

				multi.hdel(key_status, 'down_timestamp'); 
				
				if (params.request_status.warning){
					multi.sadd ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'warning_by_minute'), minute_time_stamp);
					multi.hmset(key_status, 'lastwarning' , params.request_status.timestamp);
				}
			}
			else if (params.event_type == 'error'){
				multi.hmset(key_status, 'down_timestamp', params.request_status.down_timestamp); 
				multi.sadd ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'error_by_minute'), minute_time_stamp);
			}
			else
				{ throw 'bad event_type' }
		
			multi.exec(function(err, replies) {
				callback(err);
			});
		});
	});
}

/* Will trigger when service takes more to reply than "limit" */
function on_warning (params){

}

/* Will trigger when the site is down or conditions are not satisfied */
function on_failure (params){
	var url_info = get_url_info (params.url_conf.host, params.url_conf)

	var info = url_info + ' down!. Error: ' + params.error + '. Retrying in ' + params.request_status.next_attempt_secs / 60 + ' minute(s)..';
	log_error (info); 

	if (params.request_status.previous_state.status != 1 && config.notifications.Enabled){
		email_service.sendEmail(
			params.url_conf.alert_to || params.url_conf.host.alert_to || config.notifications.To,
			url_info + ' is down!', url_info + ' is down!. Reason: ' + error, function (err, data){
				if (err){
					console.error (url_conf + ': error sending email: ' + JSON.stringify(err));
				}
			});
	}
	else{
		log_info ('Notification disabled or not triggered this time (site down) for ' + url_info);
	}
}

/* Will trigger when the site was down and gets back online */
function on_site_back (params){
	var url_info = get_url_info (params.url_conf.host, params.url_conf)
	if (config.notifications.Enabled){
		email_service.sendEmail(
			params.url_conf.alert_to || params.url_conf.host.alert_to || config.notifications.To,
			url_info + ' ' +  params.msg, function(err, data){
				if (err){
					console.error (params.url_conf + ': error sending email: ' + JSON.stringify(err));
				}
			});
	}
	else{
		log_info ('Notification disabled or not triggered this time (site back) for ' + url_info);
	}

}

/* Will trigger when the site responses successfully */
function on_success (params){
	//do something else here when site reports 'success'
	var url_info = get_url_info (params.url_conf.host, params.url_conf)
	log_ok (url_info + ' responded OK! (' + params.request_status.elapsed_time + ' milliseconds, avg: ' + params.request_status.avg_response_time + ')')

}

function query_url(url_conf, redis, request, config, timestamp, callback){
	var host_conf = url_conf.host
	var url_info = get_url_info (url_conf.host, url_conf);
	var error = null
	
	current_requests++; //concurrent open requests

	request (url_conf, function(request_err, body, response, elapsed_time){
		current_requests--;
		log_info ('concurrent requests:' + current_requests);
		
		get_url_status (url_conf, redis, function (err, previous_state){
			if (err) return callback (err);

			var request_status = {
				elapsed_time : elapsed_time,
				timestamp : timestamp,
				previous_state : previous_state,
				events: []
			}; 

			//decide if service is down
			var params = {url_conf:url_conf, request_status: request_status}
			if (!request_err){ //request completed successfully
				if (url_conf.expected){
					if (response.statusCode != url_conf.expected.statuscode){
						error = 'FAILED! expected status code :' + url_conf.expected.statuscode + ' at ' 
							+ url_conf.url + ' but got ' + response.statusCode
					}
					else if (url_conf.expected.contains && (!body || (body.indexOf(url_conf.expected.contains)==-1))){
						error = 'FAILED! expected text "' + url_conf.expected.contains + '" but it wasn\'t found'
					}
				}
			}
			else {
				error = 'Connection error when processing request: ' + request_err
			}

			request_status.status = error ? 0 : 1

			if (error){ //service down
				//set new down timestamp if first hit when site down
				request_status.down_timestamp = previous_state.down_timestamp ? previous_state.down_timestamp : request_status.timestamp;

				if (previous_state.status != 0) //record event only if this is the first error for this service.
					request_status.events.push({type: 'error' , msg: error});
				
				on_failure (params);
			}
			else {  //service is up
				request_status.avg_response_time = Math.round(previous_state ? ((previous_state.avg_response_time || 0) * (previous_state.responses_count || 0) 
							+ elapsed_time) / (parseInt(previous_state.responses_count || 0) + 1) : elapsed_time);

				var limit = url_conf.warning_if_takes_more_than || host_conf.warning_if_takes_more_than;
				if (limit && (elapsed_time > limit)){ //over the limit. warning!
					request_status.events.push({type: 'warning' , msg: 'request for ' + url_info + ' took too much: ' + elapsed_time + ' milliseconds. Limit=' + limit + ' milliseconds'});
					request_status.warning = true;

					//todo: as warning, record just time instead of full text.
				}

				if ((previous_state != null) && (previous_state.status == 0)){ //service was down and now it is up again!
					request_status.down_time = Math.round((timestamp - previous_state.down_timestamp) / 1000);
					request_status.events.push({type: 'success' , msg: 'site is back! down_time: ' + request_status.down_time});

					on_site_back (params);
				}
				else { //service is ok. 
					on_success (params);
				}
			}

			//calculate next interval
			request_status.next_attempt_secs = error ? 
				(url_conf.failed_ping_interval || url_conf.host.failed_ping_interval || 70) //interval if error
				: (url_conf.ping_interval || url_conf.host.ping_interval) //interval if ok


			update_status(redis, params, function (err){
				callback (err, request_status);
			})
		});
	})
}
exports.query_url = query_url

function processUrl (url_conf, redis){
	var request = require ('./request');
	var timestamp = new Date().getTime()
	query_url(url_conf, redis, request.processRequest, config, timestamp, function (err, request_status) {
		if (err){
			console.error ('ERROR' + err);
		}
		else {
			setTimeout (processUrl, request_status.next_attempt_secs * 1000, url_conf, redis);
		}
	})
}
exports.processUrl = processUrl