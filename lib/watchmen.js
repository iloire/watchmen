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
	, sys = require('util')
	, colors = require('colors')
	, config = require ('../config')
	, util = require ('./util')
	, events = require('events')

function $() { return Array.prototype.slice.call(arguments).join(':') }

function WatchMen(services, redis, request, options){

	this.services = services;
	this.redis = redis;
	this.request = request;
	this.daemon_status = 0; //0=stopped, 1=running
	this.current_requests = 0

	/*
	this.get_url_info = function (host_conf, url_conf){
		return host_conf.name + ' - ' + host_conf.host + ':'+ host_conf.port  + url_conf.url + ' [' + url_conf.method + ']'
	}
	*/

	this.get_url_status = function (url_conf, callback) {
		this.redis.hgetall ($(url_conf.host.host, url_conf.host.port, url_conf.url, 'status'), callback);
	}

	/*
		- status: 1 = ok, 0 = error
	*/
	//url_conf, request_status
	this.update_status = function (params, callback){
		if (!params.url_conf || !params.request_status || !params.request_status.timestamp){
			return callback ('bad parameters');
		}

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
					var event_obj = {timestamp : params.request_status.timestamp, status: params.request_status.events[i].status, msg : params.request_status.events[i].msg }
					multi.lpush($(url_key_prefix, 'events', params.request_status.events[i].status), JSON.stringify(event_obj));
				};

				//update status
				var key_status = $(url_key_prefix, 'status');

				multi.hmset(key_status, 'status', params.request_status.status); 
				multi.hmset(key_status, 'last' + params.request_status.status, params.request_status.timestamp); 

				if (params.request_status.status == 'success') {

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
					
					if (params.request_status.warning){ //warning?
						multi.sadd ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'warning_by_minute'), minute_time_stamp);
						multi.hmset(key_status, 'lastwarning' , params.request_status.timestamp);
					}
				}
				else if (params.request_status.status == 'error'){
					multi.hmset(key_status, 'down_timestamp', params.request_status.down_timestamp); 
					multi.sadd ($(url_key_prefix, util.get_day_date_str(params.request_status.timestamp), 'error_by_minute'), minute_time_stamp);
				}
				else
					{ throw 'bad event_type' + params.status }
			
				multi.exec(function(err, replies) {
					callback(err);
				});
			});
		});
	}
}

sys.inherits(WatchMen, events.EventEmitter);

WatchMen.prototype.query_url = function (url_conf, timestamp, callback){
		var self = this;
		var host_conf = url_conf.host
		
		self.current_requests++; //concurrent open requests

		self.request (url_conf, function(request_err, body, response, elapsed_time){
			self.current_requests--;
			
			//console.log('concurrent requests:' + self.current_requests);
			
			self.get_url_status (url_conf, function (err, previous_state){
				if (err) return callback (err);

				var request_status = {
					elapsed_time : elapsed_time,
					timestamp : timestamp,
					previous_state : previous_state,
					events: [],
					url_conf: url_conf
				}; 

				//decide if service is down
				var params = {url_conf: url_conf, request_status: request_status}
				if (!request_err){ //request completed successfully
					if (url_conf.expected){
						if (response.statusCode != url_conf.expected.statuscode){
							request_status.error = 'FAILED! expected status code :' + url_conf.expected.statuscode + ' at ' 
								+ url_conf.url + ' but got ' + response.statusCode
						}
						else if (url_conf.expected.contains && (!body || (body.indexOf(url_conf.expected.contains)==-1))){
							request_status.error = 'FAILED! expected text "' + url_conf.expected.contains + '" but it wasn\'t found'
						}
					}
				}
				else {
					request_status.error = 'Connection error when processing request: ' + request_err
				}

				request_status.status = request_status.error ? "error" : "success"

				if (request_status.error){ //service down
					//set new down timestamp if first hit when site down
					request_status.down_timestamp = previous_state.down_timestamp ? previous_state.down_timestamp : request_status.timestamp;

					if (previous_state.status != "error") //record event only if this is the first error for this service.
						request_status.events.push({status: 'error' , msg: request_status.error});
					
					self.emit('service_error', url_conf, request_status);
				}
				else {  //service is up
					request_status.avg_response_time = Math.round(previous_state ? ((previous_state.avg_response_time || 0) * (previous_state.responses_count || 0) 
								+ elapsed_time) / (parseInt(previous_state.responses_count || 0) + 1) : elapsed_time);

					var limit = url_conf.warning_if_takes_more_than || host_conf.warning_if_takes_more_than;
					if (limit && (elapsed_time > limit)){ //over the limit. warning!
						request_status.events.push({status: 'warning' , msg: 'request for ' + url_conf.url_info + ' took too much: ' + elapsed_time + ' milliseconds. Limit=' + limit + ' milliseconds'});
						request_status.warning = true;

						self.emit('service_warning', url_conf, request_status);
					}

					if (previous_state && (previous_state.status == "error")){ //service was down and now it is up again!
						request_status.down_time = Math.round((timestamp - previous_state.down_timestamp) / 1000);
						request_status.events.push({status: 'success' , msg: 'site is back! down_time: ' + request_status.down_time});

						self.emit('service_back', url_conf, request_status);
					}
					else { //service is ok. 
						self.emit('service_ok', url_conf, request_status);
					}
				}

				//calculate next interval
				request_status.next_attempt_secs = request_status.error ? 
						(url_conf.failed_ping_interval || url_conf.host.failed_ping_interval || 70) //interval if error
						: (url_conf.ping_interval || url_conf.host.ping_interval) //interval if ok

				self.update_status(params, function (err){
					callback (err, request_status);
				})

			});
		})
	}

WatchMen.prototype.start = function (){
	console.log('launching watchmen...');
	var self = this;
	self.daemon_status = 1;
	
	function launch (service){
			self.query_url (service, new Date().getTime(), function (err, request_status){
				if (err){
					console.error (err);
				}
				
				if (self.daemon_status==1){
					setTimeout(launch, request_status.next_attempt_secs * 1000, service);
				}
			});
	}

	for (var i=0; i < this.services.length;i++){
		if (this.services[i].enabled != false){
			launch(this.services[i]);
		}
		else{
			console.log('skipping service.. ');
		}
	}
}

WatchMen.prototype.stop = function (){
	this.daemon_status==0;
	console.log('stopping watchmen...');
}

exports.WatchMen = WatchMen;
