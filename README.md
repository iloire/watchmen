# "watchmen", HTTP monitor for node.js

  - "watchmen" monitors HTTP servers by sending GET or POST pings (HTTP requests) in pre-defined intervals.
  - You can check for a) certain status code or b) a certain text in the response stream.
  - If site is down, you will get a notification. Once the service is up again you get another notification (just email transport protocol for now by using postmark). You define notifications recipients per url, host or application level.

There is a <a href="http://letsnode.com/example-of-what-node-is-really-good-at" target="_blank">related blog post about watchmen here</a>.

# Demo

You can see an online demo of how watchmen control panel looks <a href="http://letsnode.com:8084" target="_blank">here</a>.

# Screenshots

## watchmen daemon running: 
![watchmen daemon](https://github.com/iloire/WatchMen/raw/master/screenshots/watchmen_daemon01.png)

## list of hosts: 
![List of hosts](https://github.com/iloire/WatchMen/raw/master/screenshots/list_hosts.png)

## host downtime and warning details:
![Host downtime and warning details](https://github.com/iloire/WatchMen/raw/master/screenshots/host_details01.png)

## Installation

Watchmen depends on the following modules:

 - [colors](https://github.com/Marak/colors.js)
 - [ejs](https://github.com/visionmedia/ejs)
 - [express](https://github.com/visionmedia/express)
 - [node_redis](https://github.com/mranney/node_redis)

Make sure you install those dependencies by issuing the command:

		$ npm install

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
			alert_to: ['ivan@iloire.com'], //emails to alert if site goes down.
			warning_if_takes_more_than: 700, //miliseconds. alert if request takes more than this
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

  c) **Run watchmen**

		$ node watchmen.js

  or more probably you would want to use **forever** to run it in the background

		$ forever start watchmen.js

  d) **Run the web app to display status reports**

		$ forever start webserver/app.js 3000 (where 3000 is the port you want to use).

  You can also run the tests by using

		$ node test/runtests.js

## History

**0.9**

  - Major refactor, improved performance.
  - Added tests and mocked objects for testing.
  - Separate files for request, utils and watchmen library.

**0.8**

  - Removed logging to file.
  - Bug fixing when storing event. Needed to add port to redis key to make it unique.
  - Added callback when sending email to registered problems in delivery.

**0.7**

  - **Targets node 0.6.x**
  - Added [knockoutjs](http://knockoutjs.com) for view model binding.
  - Auto **async refresh** main page.
  - **Filter** by name in main page.
  - Added counter (hosts up and down).
  - UI Improvements.
  - Tablesorter sorts status and time tags.
  - Added Google Analytics.

**0.6**

  - Added current status info (site is up or down) to database.
  - Added icons to display status (disable, error or ok).
  - TableSorter jQuery plugin orders by status by default.

**0.5**

  - Added expiration time to event records.
  - Stores avg response time for each url.
  - Warns if response time > limit.
  - Multiple recipients in notifications.
  - Removed "retry_in" option. Watchmen works in a smarter way now.
  - REDIS backend.
  - **Web UI to display reports** (express.js app using REDIS backend).

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

 - Security
 - Google charts
 - Uptime stats info
 - Change configuration from control panel
 - Reset stats from control panel
 - Create NPM package 
 - Regular expressions support