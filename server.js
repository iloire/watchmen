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

//var config = require('./config.js')
var config = require('./config.js')

var redis = require("redis").createClient(config.database.port, config.database.host);
redis.select (config.database.db);

var watchmen = require ('./lib/watchmen')

/*main*/
watchmen.log_info ('\nstarting watchmen...')
watchmen.log_info ('reading configuration and queuing hosts for pinging...')

var initial_delay=0;
for (var i=0; i<config.hosts.length;i++){
	var host = config.hosts[i];
	if (host.enabled != false){
		watchmen.log_info ('monitoring ' + host.name + ':')
		for (var u=0;u<config.hosts[i].urls.length;u++){
			initial_delay++;
			if (host.urls[u].enabled != false){
				host.urls[u].host = host
				var ping = host.urls[u].ping_interval || host.ping_interval
				watchmen.log_info (' -- queuing "' + host.urls[u].url + '".. ping every ' + ping + ' seconds...')
				setTimeout (watchmen.processUrl, initial_delay * 400, host.urls[u], redis);
			}
			else{
				watchmen.log_warning (' -- skipping url: ' + host.name + host.urls[u].url + ' (disabled entry)...')
			}
		}
	}
	else{
		watchmen.log_warning ('skipping host: ' + host.name + ' (disabled entry)...')
	}
}

process.on('SIGINT', function () {
	console.log('stopping watchmen..');
	redis.quit();
	process.exit(0);
});