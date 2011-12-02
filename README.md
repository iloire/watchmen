# "Watchmen", HTTP monitor for node.js

  - Watchmen monitors HTTP servers by sending GET or POST pings (HTTP requests) in pre-defined intervals.
  - You can check for a) certain status code or b) a certain text in the response stream.
  - If site is down, ping interval will change (10', 30', 1 hour, etc... set in config file) until the site is back up again. Once the service is up again you get another email.
  - You are notified by email by using postmarkapp.com

## Configuration
  
  Edit config.js:
  
  a) **Define hosts and url's to be monitored:**

		{
			name:'letsnode.com',
			host: 'letsnode.com',
			port:80, 
			ping_interval: one_minute * 5, //set ping interval (in seconds)
			//set retry interval (in minutes), you can add as many intervals as you want
			//if site is still down, will repeat the last interval
			retry_in: [10,30,120], 
			enabled: true, //enables/disables this host
			notify_after_failed_ping: 1, //want to receive notification after "n" failed pings
			urls : [
				{
					method: 'get', 
					url : '/', 
					//expected status code and expected string to be found in the response (otherwise will fail)
					expected: {statuscode: 200, contains: 'A blog about node.js and express.js'}
				}
			]
		}
  
  b) **Define Postmark and notifications settings:**

		exports.notifications = {
			Enabled: true, //if disabled, just console messages on site down
			To: 'ivan@iloire.com'
		} 

		exports.postmark = {
			From: 'your-email-here',
			Api_key : 'your-postmark-key-here'
		}

## History

**0.2**

  - Allow ping with POST method (for testing forms)
  - Added Marak/colors.js to output success and error messages
  - Refactoring

**0.1**

  - First release.

## TODO

 - Write log to file
 - Stats
 - Regular expressions support
 - REDIS support