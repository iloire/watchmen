var config = require('./config.js')
var http = require('http');
var postmark= require('./postmark');

function processRequest (request, callback){
	request.on('response', function(response) {
		response.setEncoding('utf-8');
		var body = '';
		response.on('data', function(chunk) {
			body += chunk;
		});
	
		response.on('end', function() {
			callback(body, response)
		});
	});
	request.write("");
	request.end();
}

function query_url(url_conf){
	var host_conf = url_conf.host
	var client = http.createClient(host_conf.port || 80, host_conf.host);
	var request = client.request(url_conf.method, url_conf.url, {'Host': host_conf.host });
	
	processRequest(request, function(body, response){
		var error, next_attempt_secs
		if (response.statusCode != url_conf.expected.statuscode){
			error = 'we expected status code ' + url_conf.expected.statuscode + ' at ' + url_conf.url + ' but got ' + response.statusCode
		}
		else if (url_conf.expected.contains && body.indexOf(url_conf.expected.contains)==-1){
			error = 'expected text ' + url_conf.expected.contains + ' but no found '
		}
		
		console.log (host_conf.host + ':'+ host_conf.port + ', url: "' +  url_conf.url + '" : ' + (error || ' response ok!'))
		
		if (error){
			postmark.sendEmail(
				{
				'From' : config.postmark.From,
				'To': host_conf.alert_to || config.notifications.To,
				'Subject':config.notifications.Subject.replace('{site}', host_conf.name),
				'TextBody': error }, config.postmark.Api_key, function(err, data) {
				
				if (err) {
					console.log('Error sending email: ' + JSON.stringify(err))
				} else {
					console.log('Email sent successfully')
				}
			})
			
			if (!url_conf.attempts)
				url_conf.attempts=1
			else if (url_conf.attempts < (url_conf.retry_in || url_conf.host.retry_in).length-1){
				url_conf.attempts++;
			}
			
			next_attempt_secs = (url_conf.retry_in || url_conf.host.retry_in) [url_conf.attempts] * 60;
			console.log ('Site down! Retrying in ' + next_attempt_secs / 60 + ' minutes..' )
		}
		else { //queue next ping
			next_attempt_secs = (url_conf.ping_interval || url_conf.host.ping_interval);
		}
		
		setTimeout (query_url, next_attempt_secs * 1000, url_conf);	
	})
}

/*main*/

console.log ('Starting Watchmen...')

for (var i=0; i<config.hosts.length;i++){
	var host = config.hosts[i];
	console.log ('Monitoring ' + host.name + ':')
	for (var u=0;u<config.hosts[i].urls.length;u++){
		var url = host.urls[u]
		url.host = host
		var ping = (url.ping_interval || host.ping_interval) 
		console.log (' -- ping "' + url.url + '" every ' + ping + ' seconds...')
		setTimeout (query_url, ping * 1000, url);
	}
}