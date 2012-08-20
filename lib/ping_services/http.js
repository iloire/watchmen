var http = require('http');
var https = require('https');

function ping (url_conf, callback){
	// record start time
	var startTime = new Date();

	var headers = {
		'Host': url_conf.host.host
	};

	if (url_conf.method == 'post'){
		headers['Content-Type'] = url_conf.content_type;
		headers['Content-Length'] = JSON.stringify(url_conf.input_data || '').length;
	}

	//var client = http.createClient(url_conf.host.port || 80, url_conf.host.host);
	var method = url_conf.method;
	if (!url_conf.expected || !url_conf.expected.contains){
		method = "HEAD";
	}

	//var request = client.request(method, url_conf.url, headers);
	var options = {
		port: url_conf.host.port,
		host: url_conf.host.host,
		path: url_conf.url,
		method: method,
		agent:false
	};

	var request;
	if((url_conf.host.protocol) && (url_conf.host.protocol == "https")) {
		request = https.request(options);
		https.globalAgent.maxSockets=500;
	} else  {
		request = http.request(options);
		http.globalAgent.maxSockets=500;
	}

	var handled_callback = false;
	var error = null;

	request.setTimeout(url_conf.timeout || 10000, function(){
		if (!handled_callback){
			handled_callback = true;
			callback('Timeout');
		}
	});

	request.addListener('error', function(connectionException){
		error = connectionException.errno || 'Error establishing connection';
		if (!handled_callback){
			handled_callback = true;
			callback(error);
		}
	});

	request.on('response', function(response) {
		response.setEncoding('utf-8');
		var body = '';

		response.on('data', function(chunk) {
			body += chunk;
		});

		response.on('end', function() {
			var timeDiff = (new Date() - startTime);
			if (!handled_callback){
				handled_callback = true;
				callback(null, body, response, timeDiff);
			}
		});

		response.on('error', function(e) {
			error = e.message;
		});
	});

	request.on('error', function(e) {
		if (!handled_callback){
			handled_callback = true;
			callback(e.message + '. Details :' + url_conf.host.host + url_conf.url);
		}
	});

	request.write(JSON.stringify(url_conf.input_data) || '');
	request.end();
}

module.exports.ping = ping;
