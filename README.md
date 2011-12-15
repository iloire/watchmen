# "watchmen", HTTP monitor for node.js

  - "watchmen" monitors HTTP servers by sending GET or POST pings (HTTP requests) in pre-defined intervals.
  - You can check for a) certain status code or b) a certain text in the response stream.
  - If site is down, you will get a notification. Once the service is up again you get another notification (just email transport protocol for now by using postmark). You define notifications recipients per url, host or application level.

## Configuration
  
  Edit config.js:
  
  a) **Define hosts and url's to be monitored:**

		{
			name:'letsnode.com',
			host: 'letsnode.com',
			port:80, 
			ping_interval: one_minute, //set ping interval (in seconds)
			failed_ping_interval: one_minute, //set ping interval if site is down (in seconds)
			enabled: true, //enables/disables this host
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
			Enabled: false, //if disabled, no email will be sent (just console messages)
			To: 'ivan@iloire.com',
			postmark : {
				From: 'ivan@iloire.com',
				Api_key : 'your-postmark-key-here'
			}
		} 

  c) **Define logging options**

		exports.logging = {
			Enabled: true,
			base_path : './logs' //use last "/"
		}

  d) **Run watchmen**

		$ node watchmen.js

  or more probably you would want to use **forever** to run it in the background

		$ forever start watchmen.js

## History

**0.5**
  
  - Multiple recipients in notifications.
  - Removed "retry_in" option. Watchmen works in a smarter way now.
  - REDIS backend.
  - Web server control panel to display reports (express.js app using REDIS backend).

**0.4**

  - Be able to disable entries in config file at url level
  - When site is back, displays and logs information about how long the site has been down.

**0.3**
  
  - Logs "site down" and "site back up" messages to a file (logs in a different file per host)
  - Fix bug when reading url_conf.attempts on site back.

**0.2**

  - Allow POST method (for testing forms).
  - Added Marak/colors.js to output success and error messages.
  - Displays request duration time.
  - Refactoring.

**0.1**

  - First release.

## TODO
 - Google chart in url uptime history
 - Uptime stats info
 - Change configuration from control panel
 - Reset stats from control panel
 - Create NPM package 
 - Regular expressions support
 - Warning if request takes more than xx miliseconds