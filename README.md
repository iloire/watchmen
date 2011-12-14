# "watchmen", HTTP monitor for node.js

  - "watchmen" monitors HTTP servers by sending GET or POST pings (HTTP requests) in pre-defined intervals.
  - You can check for a) certain status code or b) a certain text in the response stream.
  - If site is down, ping interval will change (10', 30', 1 hour, etc... you set that in the config file) until the site is back up again. Once the service is up again you get another notification (email for now).
  - You are notified if the site is down by using postmarkapp.com (you can choose whatever being notified in the first, second, etc.. failure). You will be notified again once the site is back up online.

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

  - REDIS backend
  - Web server control panel to display reports (express.js app using REDIS backend)

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