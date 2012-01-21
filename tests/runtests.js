var watchmen = require ('../lib/watchmen.js')
var config = require ('../config.js')
var async = require ('async')
var assert = require ('assert')

var _redis = require("redis")
var redis = _redis.createClient()

function $() { return Array.prototype.slice.call(arguments).join(':') }

config.notifications.Enabled = false;

function printCurrentTest() {
	console.log(arguments.callee.caller.name + " .............................. OK!");
}

var request_mocked = require ('./lib/request_mocked')

var tests= [
	function setup_tests(callback){
		printCurrentTest();
		console.log ("-----------------")
		redis.flushall(function(err, data){
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
		
		var request_mocked = require ('./lib/request_mocked')
		request_mocked.mocked_response = {error: 'error', body : null, response : null, timeDiff : 0};
		
		watchmen.query_url(url, redis, request_mocked.processRequest, config, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 0)
			assert.ok (data.msg.indexOf('Connection error')>-1)
			assert.ok (data.next_attempt_secs, 4);
			assert.equal (data.next_attempt_secs, url.failed_ping_interval);

			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,data){
				assert.ok (!data.lastwarning)
				assert.ok (!data.lastok)
				assert.ok (data.lasterror)
				
				assert.ok (!err)
				assert.equal (data.status,0)
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events'), 0, 100, function(err, timestamps) {
					assert.ok (!err)
					assert.equal (timestamps.length, 1)
					redis.hgetall ($(url.host.host, url.host.port, url.url, 'event', timestamps[0]), function (err, event_data){
						assert.ok (event_data.msg.indexOf('error')>-1);
						callback (null,null)
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
		
		var request_mocked = require ('./lib/request_mocked')
		request_mocked.mocked_response = {error: null, body : 'hola', response : {statusCode: 200}, timeDiff : 300};
				
		watchmen.query_url(url, redis, request_mocked.processRequest, config, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 1)
			assert.ok (data.msg==null);
			assert.ok (data.next_attempt_secs, 60);
			assert.ok (data.elapsed_time, 230)
			assert.equal (data.next_attempt_secs, url.ping_interval);
						
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,data){
				assert.ok (!data.lastwarning)
				assert.ok (data.lastok)
				assert.equal (data.lasterror)
				
				assert.ok (!err)
				assert.equal (data.status,1)
				assert.equal (data.avg_response_time, 300)
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events'), 0, 100, function(err, timestamps) {
					assert.ok (!err)
					assert.equal (timestamps.length, 0)
					callback (null,null)
				});
			});
		})
	}
	,
	function test_response_ok_expected_status_code_fails (callback){
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: 'hola'}
		}
		
		var request_mocked = require ('./lib/request_mocked')
		request_mocked.mocked_response = {error: null, body : 'hola', response : {statusCode: 301}, timeDiff : 0};
				
		watchmen.query_url(url, redis, request_mocked.processRequest, config, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 0)
			assert.ok (data.msg.indexOf('expected status code')>-1);
			assert.equal (data.next_attempt_secs, url.failed_ping_interval);
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,data){
				assert.ok (!data.lastwarning)
				assert.ok (data.lastok)
				assert.ok (data.lasterror)
				
				assert.ok (!err)
				assert.equal (data.status, 0)
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events'), 0, 100, function(err, timestamps) {
					assert.ok (!err)
					assert.equal (timestamps.length, 1)
					redis.hgetall ($(url.host.host, url.host.port, url.url, 'event', timestamps[0]), function (err, event_data){
						assert.ok (event_data.msg.indexOf('FAILED! expected status')>-1, event_data);
						callback (null,null)
					});
				});
			});
		})
	}
	,
	function test_response_ok_with_warning (callback){
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
		
		var request_mocked = require ('./lib/request_mocked')
		request_mocked.mocked_response = {error: null, body : 'hola', response : {statusCode: 200}, timeDiff : 500};
				
		watchmen.query_url(url, redis, request_mocked.processRequest, config, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 1)
			assert.ok (data.msg.indexOf('took too much')>-1, data.msg)
			assert.equal (data.next_attempt_secs, url.ping_interval);
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,data){
				assert.ok (data.lastwarning)
				assert.ok (data.lastok)
				assert.ok (data.lasterror)

				assert.ok (!err)
				assert.equal (data.status, 1)
				assert.equal (data.avg_response_time, 400)
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events'), 0, 100, function(err, events) {
					assert.ok (!err)
					assert.equal (events.length, 3)
					redis.hgetall ($(url.host.host, url.host.port, url.url, 'event', events[0]), function (err, event_data){
						assert.ok (event_data.msg.indexOf('took too much')>-1, JSON.stringify(event_data));
						callback (null,null)
					});
				});
			});
		})
	}
	,
	function test_response_ok_expected_text_fails (callback){
		printCurrentTest();
		var url = {
			host : {host: 'www.google.com', port:'80', name : 'test'},
			url : '/',
			ping_interval: 4,
			//failed_ping_interval:30,
			method : 'get',
			expected : {statuscode: 200, contains: 'hola'}
		}
		
		var request_mocked = require ('./lib/request_mocked')
		request_mocked.mocked_response = {error: null, body : '', response : {statusCode: 200}, timeDiff : 0};
				
		watchmen.query_url(url, redis, request_mocked.processRequest, config, function(err, data){
			assert.ok (!err)
			assert.equal (data.status, 0)
			assert.ok (data.msg.indexOf('expected text')>-1);
			assert.equal (data.next_attempt_secs, 70);
			redis.hgetall ($(url.host.host, url.host.port, url.url, 'status'), function (err,data){
				assert.ok (data.lastwarning)
				assert.ok (data.lastok)
				assert.ok (data.lasterror)

				assert.ok (!err)
				assert.equal (data.status,0)
				redis.lrange ($(url.host.host, url.host.port, url.url, 'events'), 0, 100, function(err, timestamps) {
					assert.ok (!err)
					assert.equal (timestamps.length, 4)
					redis.hgetall ($(url.host.host, url.host.port, url.url, 'event', timestamps[0]), function (err, event_data){
						if (!err){
							assert.ok (event_data.msg.indexOf('FAILED! expected text')>-1, event_data);
							assert.equal (timestamps.length,4)
							callback (null,null)
						}
						else{
							console.log(err)
						}
					});
				});
			});
		})
	}
	,
	function test_display_hosts (callback){

		printCurrentTest();
		
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
		
		function get_hosts_status (hosts, callback){
			watchmen.get_hosts(redis, hosts, function(err, hosts){
				callback (err, hosts);
			})			
		}

		var urls = get_urls_from_hosts(config.hosts);

		function process_mocked_call(url, callback){
			request_mocked.mocked_response = {error: null, 
				body : url.expected ? url.expected.contains : "", 
				response : {statusCode: url.expected ? url.expected.statuscode :200},
				timeDiff : 0};
			watchmen.query_url(url, redis, request_mocked.processRequest, config, function(err, data){
				callback(err, data);
			});
		}

		async.map (urls, process_mocked_call, function (err, results){
			for (var i=0;i<results.length;i++) {
				assert.ok (results[i].status, JSON.stringify(results[i]));
				assert.ok (results[i].avg_response_time==null);
			}
			callback(null,null);
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
	console.log ("All good!")
	redis.quit();	
	process.exit(1);	
})
