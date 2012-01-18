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

var http = require('http');

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
		return;
	});

	request.on('response', function(response) {
		response.setEncoding('utf-8');
		var body = '';

		response.on('data', function(chunk) {
			body += chunk;
		});

		response.on('end', function() {
			var timeDiff = (new Date() - startTime);
			callback(null, body, response, timeDiff)
			return;
		});

		response.on('error', function(e) {
			callback(e.message, null, null, null)
			return;
		});
	});

	request.on('error', function(e) {
		callback(e.message + '. Details :' + url_conf.host.host + url_conf.url, null, null, null)
	});

	request.write(JSON.stringify(url_conf.input_data) || '');
	request.end();
}

exports.processRequest = processRequest;