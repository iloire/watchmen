var watchmen_lib = require ('../lib/watchmen.js')
	, util = require ('../lib/util.js')
	, reports = require ('../lib/reports.js')
	, config = require ('../config.js')
	, async = require ('async')
	, assert = require ('assert');

var redis = require("redis").createClient(config.database.port, config.database.host);
redis.select (config.database.db);

function $() { return Array.prototype.slice.call(arguments).join(':') }

config.notifications.Enabled = false;

function printCurrentTest() {
	console.log(arguments.callee.caller.name + " .............................. OK!");
}

var request_mocked = require ('./lib/request_mocked')
var timestamp = util.pad_date_to_minute_str(new Date().getTime());

var services = []
var hosts = require('../config/hosts');
for (var i=0; i<hosts.length;i++){
	for (var u=0;u<hosts[i].urls.length;u++){
		hosts[i].urls[u].host = hosts[i]
		services.push (hosts[i].urls[u]);
	}
}

var watchmen = new watchmen_lib.WatchMen(services, redis, request_mocked.processRequest);

var tests = [
	function setup_tests(callback){
		printCurrentTest();
		console.log ("-----------------")
		redis.flushall(function(err, data){ //clear database
			callback(null,null);
		});
	}
	,
	function test_bad_dns (callback){
		printCurrentTest();
		var url = {
			host : {host: 'bad_dns', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			failed_ping_interval: 5,
			method : 'get',
			expected : {statuscode: 200, contains: ''}
		}
		
		var minute_time_stamp = util.get_minute_str(timestamp);
		
		request_mocked.mocked_response = {error: 'error', body : null, response : null, timeDiff : 0};
	
		watchmen.query_url(url, timestamp, function(err, request_status){
			assert.ok (!err, err)
			assert.equal (request_status.status, 0)
			assert.equal (request_status.next_attempt_secs, url.failed_ping_interval);
			assert.ok (request_status.url_conf, JSON.stringify(request_status))
			assert.equal (request_status.url_conf.url_info)

			//check status
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,status){
				assert.ok (!err)

				assert.ok (!status.lastwarning)
				assert.ok (!status.lastsuccess)
				assert.equal (status.lasterror, timestamp)
				assert.equal (status.down_timestamp, timestamp);
				assert.equal (status.status,0)

				//one event
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events','error'), 0, 100, function(err, events) {
					assert.ok (!err)
					assert.equal (events.length, 1)
					var event_obj = JSON.parse(events[0])
					assert.equal (event_obj.event_type, 'error')
					
					//one error
					redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'error_by_minute'), function(err, number_values){
						assert.ok (!err)
						assert.equal(number_values,1);
						
						//no warnings
						redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'warning_by_minute'), function(err, number_values){
							assert.ok (!err)
							assert.equal(number_values,0);

							redis.get ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time', minute_time_stamp, 'counter'), function(err, counter){
								assert.ok (!err)
								assert.ok (!counter)
								callback (null,null)
							});
						});
					});
				});
			});
		})
	}
	
	,
	function test_response_ok (callback){
		printCurrentTest();
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 60,
			failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: 'hola'}
		}
		
		var minute_time_stamp = util.get_minute_str(timestamp);
		var hour_time_stamp = util.get_hour_str (timestamp);

		request_mocked.mocked_response = {error: null, body : 'hola', response : {statusCode: 200}, timeDiff : 300};

		watchmen.query_url(url, timestamp, function(err, data){
			assert.ok (!err, err)

			assert.equal (data.status, 1)
			assert.equal (data.msg,null);
			assert.equal (data.next_attempt_secs, 60);
			assert.ok (data.elapsed_time, 'Elapsed time not found')
			assert.equal (data.next_attempt_secs, url.ping_interval);
			assert.ok (!data.down_timestamp, data.down_timestamp)
			assert.ok (!data.error);
			
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err, data){
				assert.ok (!err)

				assert.ok (!data.lastwarning)
				assert.ok (data.lastsuccess)
				assert.equal (data.lasterror)
				
				assert.equal (data.status,1)
				assert.equal (data.avg_response_time, 300)

				redis.lrange ($(url.host.host, url.host.port, url.url, 'events','error'), 0, 100, function(err, events) {
					assert.ok (!err)
					assert.equal (events.length, 0)
					
					//no errors
					redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'error_by_minute'), function(err, number_values){
						assert.ok (!err)
						assert.equal(number_values,0);

						//no warnings
						redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'warning_by_minute'), function(err, number_values){
							assert.ok (!err)
							assert.equal(number_values,0);
							
							//we are starting calc avg response time per minute
							redis.get ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time', hour_time_stamp, 'counter'), function(err, counter){
								assert.ok (!err)
								assert.equal (counter, 1)

								//make sure we have a new member in sorted set for this minute with score = avg_response_time
								redis.zscore ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time'), hour_time_stamp, function(err, avg_response_time){
									assert.ok(!err)
									assert.equal (avg_response_time, request_mocked.mocked_response.timeDiff)
									callback (null,null)
								});
							});
						});
					});
				});
			});
		})
	}
	,
	function test_got_another_response_ok (callback){
		printCurrentTest();
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 60,
			failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: 'hola'}
		}
		
		timestamp = timestamp + (1000 * 10); //10 seconds later

		var minute_time_stamp = util.get_minute_str(timestamp);
		var hour_time_stamp = util.get_hour_str (timestamp);

		request_mocked.mocked_response = {error: null, body : 'hola', response : {statusCode: 200}, timeDiff : 500};
				
		watchmen.query_url(url, timestamp, function(err, data){
			assert.ok (!err)

			assert.equal (data.status, 1)
			assert.ok (!data.error);
			assert.equal (data.msg,null)
			assert.equal (data.next_attempt_secs, 60)
			assert.ok (data.elapsed_time, 'Elapsed time not found')
			assert.equal (data.next_attempt_secs, url.ping_interval)
			assert.ok (!data.down_timestamp, data.down_timestamp)
			
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err, data){
				assert.ok (!err)

				assert.ok (!data.lastwarning)
				assert.ok (data.lastsuccess)
				assert.equal (data.lasterror)
				
				assert.equal (data.status,1)
				assert.equal (data.avg_response_time, 400) //the avg between 300 and 500

				redis.lrange ($(url.host.host, url.host.port, url.url, 'events','error'), 0, 100, function(err, events) {
					assert.ok (!err)
					assert.equal (events.length, 0)
					
					//no errors
					redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'error_by_minute'), function(err, number_values){
						assert.ok (!err)
						assert.equal(number_values,0)

						//no warnings
						redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'warning_by_minute'), function(err, number_values){
							assert.ok (!err)
							assert.equal(number_values,0)
							
							//check avg response
							redis.get ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time', hour_time_stamp, 'counter'), function(err, counter){
								assert.ok (!err)
								assert.equal (counter, 2)
								
								//make sure we have a new member in sorted set for this minute with score = avg_response_time
								redis.zscore ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time'), hour_time_stamp, function(err, avg_response_time){
									assert.ok(!err)
									assert.equal (avg_response_time, 400) //avg of the last 2 calls (300 and 500)
									callback (null,null)
								});
							});
						});
					});
				});
			});
		});
	}
	,
	function test_expected_status_code_fails (callback){
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: 'hola'}
		}
		
		timestamp = timestamp + (1000 * 20); //20 seconds later

		var minute_time_stamp = util.get_minute_str(timestamp);
		var hour_time_stamp = util.get_hour_str (timestamp);

		request_mocked.mocked_response = {error: null, body : 'hola', response : {statusCode: 301}, timeDiff : 0};
				
		watchmen.query_url(url, timestamp, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 0)
			assert.ok (data.error);
			assert.equal (data.next_attempt_secs, url.failed_ping_interval);
			
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,data){
				assert.ok (!err)
				assert.ok (!data.lastwarning)
				assert.ok (data.lastsuccess)
				assert.ok (data.lasterror)
				assert.equal (data.down_timestamp, timestamp);
				assert.equal (data.avg_response_time, 400) //the avg still 400
				assert.equal (data.status, 0)

				redis.lrange ($(url.host.host, url.host.port, url.url, 'events','error'), 0, 100, function(err, events) {
					assert.ok (!err)
					assert.equal (events.length, 1)
					var event_obj = JSON.parse(events[0])
					assert.equal (event_obj.event_type, 'error')
					assert.ok (event_obj.msg.indexOf('status code')>-1)

					redis.lrange ($(url.host.host, url.host.port, url.url, 'events','success'), 0, 100, function(err, events) {
						assert.ok (!err)
						assert.equal (events.length, 0)
						
						//one error
						redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'error_by_minute'), function(err, number_values){
							assert.ok (!err)
							assert.equal(number_values,1);
							
							//zero warning
							redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'warning_by_minute'), function(err, number_values){
								assert.ok (!err)
								assert.equal(number_values,0);

								//check avg response. This haven't changed from last request (we got an error)
								redis.get ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time', hour_time_stamp, 'counter'), function(err, counter){
									assert.ok (!err)
									assert.equal (counter, 2) //didn't change
									
									//make sure we have a new member in sorted set for this minute with score = avg_response_time
									redis.zscore ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time'), hour_time_stamp, function(err, avg_response_time){
										assert.ok(!err)
										assert.equal (avg_response_time, 400) //this did't change either

										//reports module should give this exactly same information
										reports.get_reports_by_host(redis, url.url, url.host.host, url.host.port, function (err, reports){
											assert.ok(!err, err);
											assert.equal(reports.logs_warning.length, 0);
											assert.equal(reports.logs_critical.length, 1);
											assert.equal(reports.logs_success.length, 0);
											assert.equal(reports.report_by_day[0].minutes_with_warnings, 0)
											assert.equal(reports.report_by_day[0].minutes_with_errors, 1)
											callback (null,null)	
										})
										
									});
								});
							});
						});
					});
				});
			});
		})
	}
	
	,
	function test_response_ok_with_warning (callback){ //site is dns.resolve4(name, callback);, got warning
		printCurrentTest();
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			failed_ping_interval:30,
			method : 'get',
			warning_if_takes_more_than : 400,
			expected : {statuscode: 200, contains: 'hola'}
		}
		
		timestamp = timestamp + (1000 * 25); //25 seconds later (same minute) // 55'

		var minute_time_stamp = util.get_minute_str(timestamp);
		var hour_time_stamp = util.get_hour_str (timestamp);

		request_mocked.mocked_response = {error: null, body : 'hola', response : {statusCode: 200}, timeDiff : 700};
				
		watchmen.query_url(url, timestamp, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 1)
			assert.ok (!data.error);
			assert.equal (data.next_attempt_secs, url.ping_interval);
			assert.equal (data.down_time, 25);

			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err, data){
				assert.ok (!err)
				assert.ok (data.lastwarning)
				assert.ok (data.lastsuccess)
				assert.ok (data.lasterror)
				assert.equal (data.status, 1)
				assert.equal (data.avg_response_time, 500)
				assert.ok (!data.down_timestamp);

				//site back
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events','success'), 0, 100, function(err, events) {
					assert.ok (!err)
					assert.equal (events.length, 1)
					var event_back = JSON.parse(events[0])
					assert.ok(event_back.msg.indexOf('site is back! down_time: 25')>-1, event_back.msg)

					redis.lrange ($(url.host.host, url.host.port, url.url, 'events','error'), 0, 100, function(err, events) {
						assert.ok (!err)
						assert.equal (events.length, 1)
						
						redis.lrange ($(url.host.host, url.host.port, url.url, 'events','warning'), 0, 100, function(err, events) {
							assert.equal (events.length, 1) //we got the event for failing + event for site back + event for warning
							var event_obj = JSON.parse(events[0])
							assert.ok (event_obj.msg.indexOf('took too much')>-1, JSON.stringify(events));
							
							//one error
							redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'error_by_minute'), function(err, number_values){
								assert.ok (!err)
								assert.equal(number_values,1);
								//first warning
								redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'warning_by_minute'), function(err, number_values){
									assert.ok (!err)
									assert.equal(number_values,1);
									
									//check avg response. This haven't changed from last request (we got an error)
									redis.get ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time', hour_time_stamp, 'counter'), function(err, counter){
										assert.ok (!err)
										assert.equal (counter, 3)
										
										//make sure we have a new member in sorted set for this minute with score = avg_response_time
										redis.zscore ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'avg_response_time'), hour_time_stamp, function(err, avg_response_time){
											assert.ok(!err)
											assert.equal (avg_response_time, 500) //avg of the last 3 calls (300, 500, 700)
											callback (null,null)
										});
									});
								});
							});
						});
					});
				});
			});
		})
	}
	,
	function test_expected_text_fails (callback){
		printCurrentTest();
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			//failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: 'hola'}
		}

		timestamp = timestamp + 1000; //1 second later (same minute) // 56'

		request_mocked.mocked_response = {error: null, body : '', response : {statusCode: 200}, timeDiff : 0};
				
		watchmen.query_url(url, timestamp, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 0)
			assert.ok (data.error);
			assert.equal (data.next_attempt_secs, 70);
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,data){
				
				assert.ok (!err)
				assert.ok (data.lastwarning)
				assert.ok (data.lastsuccess)
				assert.ok (data.lasterror)
				assert.equal (data.down_timestamp, timestamp);
				assert.equal (data.avg_response_time, 500)
				assert.equal (data.status,0)
				
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events','error'), 0, 100, function(err, timestamps) {
					assert.ok (!err)
					assert.equal (timestamps.length, 2)
					redis.lrange ($(url.host.host, url.host.port, url.url, 'events','warning'), 0, 100, function(err, timestamps) {
						assert.ok (!err)
						assert.equal (timestamps.length, 1)
						redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'error_by_minute'), function(err, number_values){
							assert.ok (!err)
							assert.equal(number_values,1); //same minute, just one error mark per minute
							redis.scard ($(url.host.host, url.host.port, url.url, util.get_day_date_str(timestamp), 'warning_by_minute'), function(err, number_values){
								assert.ok (!err)
								assert.equal(number_values,1);
								callback (null,null)
							});
						});
					});

				});
			});
		})
	}
	,
	function test_another_error_downtime_check (callback){
		printCurrentTest();
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: 'hola'}
		}
		timestamp = timestamp + 1000; //1 second later (same minute) // 57'

		request_mocked.mocked_response = {error: null, body : '', response : {statusCode: 200}, timeDiff : 0};

		watchmen.query_url(url, timestamp, function(err, status){
			assert.ok (!err)
			assert.equal (status.status, 0)
			assert.equal (status.next_attempt_secs, 30);
			assert.equal (status.down_timestamp, (timestamp - 1000));

			reports.get_reports_by_host(redis, url.url, url.host.host, url.host.port, function (err, reports){
				assert.ok(!err);
				assert.equal (reports.status.avg_response_time, 500)
				assert.equal(reports.logs_warning.length, 1);
				assert.equal(reports.logs_critical.length, 2); //this is the second error in a row. we only record the first one to avoid having an error every minute or so.
				assert.equal(reports.logs_success.length, 1);
				assert.equal(reports.report_by_day[0].minutes_with_warnings, 1)
				assert.equal(reports.report_by_day[0].minutes_with_errors, 1)
				callback (null,null)	
			})
		})
	}

	,
	function test_avg_next_minute (callback){
		printCurrentTest();
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			//failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: ''}
		}
		timestamp = timestamp + (1000 * 10); //jump to next minute
		request_mocked.mocked_response = {error: null, body : '', response : {statusCode: 200}, timeDiff : 300};
				
		watchmen.query_url(url, timestamp, function(err, status){
			assert.ok (!err)
			assert.equal (status.status, 1)
			assert.equal (status.next_attempt_secs, 4);

			reports.get_reports_by_host(redis, url.url, url.host.host, url.host.port, function (err, reports){
				assert.ok(!err);
				assert.equal(reports.logs_warning.length, 1);
				assert.equal(reports.logs_critical.length, 2);
				assert.equal(reports.logs_success.length, 2);
				assert.equal(reports.report_by_day[0].minutes_with_warnings, 1)
				assert.equal(reports.report_by_day[0].minutes_with_errors, 1)
				callback (null,null)	
			})
		})
	}
	
	,
	function test_display_hosts (callback){

		printCurrentTest();

		reports.get_hosts(redis, require('../config/hosts'), function(err, hosts){
			assert.equal (hosts.length, 20);

			for (var i = 0, l = hosts.length; i < l ;  i++) {
				var host = hosts[i]
				assert.ok(host.name);
				assert.ok(host.host);
				assert.ok(host.port);
				assert.ok(host.urls);
				for (var u = 0, ul = host.urls.length; u < ul ;  u++) {
					var url = host.urls[u];
					assert.ok(url.ping_interval, url.ping_interval);
				};
			};

			function process_mocked_call(url, callback){
				request_mocked.mocked_response = {error: null, 
					body : url.expected ? url.expected.contains : "", 
					response : {statusCode: url.expected ? url.expected.statuscode :200},
					timeDiff : 0};
				watchmen.query_url(url, timestamp, function(err, data){
					callback(err, data);
				});
			}

			function get_urls_from_hosts (hosts){
				var urls = []
				for (var i=0;i<hosts.length;i++){
					for (var u=0;u<hosts[i].urls.length;u++){
						var url = hosts[i].urls[u];
						url.host = hosts[i];
						urls.push (url);
					}
				}
				return urls;
			}

			var urls = get_urls_from_hosts(require('../config/hosts'));
			
			async.map (urls, process_mocked_call, function (err, results){
				for (var i=0;i<results.length;i++) {
					assert.ok (results[i].status);
				}
				callback(null,null);
			});
		});
	}
	,
	function finish(callback){
		printCurrentTest();
		redis.flushall(function(err, data){
			callback(null,null);
		});
	}	
	
]

function series(tests, callback) {
	var serie = {
		k: 0,
		errors: [],
		results: [],
		next: function() {
			if (this.k >= tests.length) {
				callback(this.errors, this.results)
			} else {
				var f = tests[this.k]
				this.k++
				f(function(that) {
					return function(a, b) {
						that.errors.push(a)
						that.results.push(b)
						that.next()
					}
				}(this))
			}
		}
	}
	serie.next()
}

series(tests, function(err, results) {
	console.log ("All good!");
	redis.quit();
	process.exit(0);
})
