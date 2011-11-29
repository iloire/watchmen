# "Watchmen", HTTP monitor for node.js

  - Watchmen Monitors HTTP servers by sending HTTP GET or POST pings in defined intervals.
  - You can check for a) certain status code or b) a certain text in the response stream
  - If site is down, ping interval will increased (10', 30', 1 hour, etc... set in config file) until the site is up.
  - You are notified by email by using postmarkapp.com

## Configuration
  
  Edit config.js:
  
  a) Define hosts and url's to be monitored:

		{
			name:'letsnode.com', 
			host: 'letsnode.com', 
			port:80, 
			ping_interval: 60 * 5,
			retry_in: [10,30,120],
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'A blog about node.js and express.js'}
				}
			]
		}
  
  b) Define Postmark and notifications settings:

		exports.notifications = {
			To: 'your-email-here',
			Subject: 'Site {site} down!'
		} 


		exports.postmark = {
			From: 'your-email-here',
			Api_key : 'your-postmark-key-here'
		}

## TODO

 - Enable POST pings
 - Write log to file
 - Stats
 - Regular expressions support