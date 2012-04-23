var config = require('../config')
var util = require('./util')

function $() { return Array.prototype.slice.call(arguments).join(':') } 

function get_avg_times_per_day (redis, url_conf, host, days_str_arr, callback){
	var multi = redis.multi();

	for (var i = 0, l = days_str_arr.length; i < l ;  i++) {

		for (var h = 0; h < 24 ; h++) {
			var hour_str = days_str_arr[0] + "_" + h;
			var key = $(host.host, host.port, url_conf.url, days_str_arr[0], 'avg_response_time');
			//console.log('key: ' + key + ', hour_str:' + hour_str);
			multi.zscore (key, hour_str);
		};
	}

	multi.exec(function(err, replies) {
		var days = {}
		var counter = 0;
		for (var i = 0, l = days_str_arr.length; i < l ;  i++) {
			days[days_str_arr[i]] = {}
			for (var h = 0; h < 24 ; h++) {
				var hour_str = days_str_arr[0] + "_" + h;
				days[days_str_arr[i]][h] = replies[counter];
				//console.log ('day: ' + days_str_arr[i] + 'h:' + h + ', val: ' + replies[counter]);
				counter++;
			};
		}
		callback (err, days)
	});
}

function get_reports_by_host(redis, str_url, str_host, str_port, callback){
	var max = 100;
	var host = null, url_conf = null;
	for (i=0;i<config.hosts.length;i++) {
		for (var u=0;u<config.hosts[i].urls.length;u++){
			if ((config.hosts[i].host==str_host) && (config.hosts[i].port==str_port) && (config.hosts[i].urls[u].url==str_url)){
				url_conf = config.hosts[i].urls[u];
				host = config.hosts[i];
				break;
			}
		}
	}
	
	if (!url_conf || !host){
		return callback ('host/url not found')
	}

	var timestamp = new Date().getTime();
	var days = [util.get_day_date_str(timestamp)];
	var multi = redis.multi();

	for (var i = 0, l = days.length; i < l ;  i++) {
		multi.scard($(host.host, host.port, url_conf.url, days[i], 'warning_by_minute'));
		multi.scard($(host.host, host.port, url_conf.url, days[i], 'error_by_minute'));
	}

	multi.lrange ($(host.host, host.port, url_conf.url, 'events', 'success'), 0, max);
	multi.lrange ($(host.host, host.port, url_conf.url, 'events', 'error'), 0, max);
	multi.lrange ($(host.host, host.port, url_conf.url, 'events', 'warning'), 0, max);

	multi.hgetall ($(host.host, host.port, url_conf.url, 'status'));
	multi.zrange ($(host.host, host.port, url_conf.url, util.get_day_date_str(timestamp), 'avg_response_time'), 0, 100);
	
	multi.exec(function(err, replies) {
		var errors = []
		var warnings = []
		var success = []

		var reports_by_day = []

		for (var i = 0, l = days.length; i < l ; i++) {
			reports_by_day.push ({day: days[i], minutes_with_warnings: replies[2*i], minutes_with_errors: replies[2*i + 1]})
		};

		//success
		var counter_extra_info = days.length*2;
		var success_str = replies[counter_extra_info];
		for (var i = 0, l = success_str.length; i < l ;  i++) {
			success.push (JSON.parse(success_str[i]))
		};

		//error
		counter_extra_info++;
		var errors_str = replies[counter_extra_info];
		for (var i = 0, l = errors_str.length; i < l ;  i++) {
			errors.push (JSON.parse(errors_str[i]))
		};

		counter_extra_info++;
		var warnings_str = replies[counter_extra_info]
		for (var i = 0, l = warnings_str.length; i < l ;  i++) {
			warnings.push (JSON.parse(warnings_str[i]))
		};

		counter_extra_info++;
		var status = replies[counter_extra_info]

		counter_extra_info++;
		var avg_times_lately = replies[counter_extra_info]
		
		var url_status = ((url_conf.enabled == false) || (host.enabled == false)) ? "disabled" : ((status==1) ? "ok": "error");

		get_avg_times_per_day(redis, url_conf, host, days, function (err, avg_data){

			var data = {
				title: host.name + ' (' + host.host + ':' + host.port + url_conf.url + ') status history', 
				status : status,
				url_status : url_status, 
				logs_success: success, 
				logs_warning: warnings, 
				logs_critical: errors,
				avg_times_lately: avg_times_lately,
				report_by_day: reports_by_day,
				today_avg_info : avg_data
			}
			callback(null, data);
		})
		
	});
}
exports.get_reports_by_host = get_reports_by_host;