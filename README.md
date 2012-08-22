# "watchmen", a service monitor for node.js

- monitor different services in your servers (http, smtp, etc).
- using http ping service, for instance, you can check for a) certain status code or b) a certain text in the response stream.
- storages are plugable. At this time, only redis storage is available.
- watchmen provides customizable notifications if service is down, the response time is over a predefined limit, etc..

There is a <a href="http://letsnode.com/example-of-what-node-is-really-good-at" target="_blank">related blog post about watchmen here</a>.

# Demo

You can see an online demo of how watchmen control panel looks <a href="http://letsnode.com:8084" target="_blank">here</a>.

# Screenshots

![List of hosts](https://github.com/iloire/WatchMen/raw/dev/screenshots/list_hosts_v010.png)

## Installation

Watchmen depends on the following modules:

- [ejs](https://github.com/visionmedia/ejs)
- [express](https://github.com/visionmedia/express)
- [moment](http://momentjs.com/)
- [node_redis](https://github.com/mranney/node_redis)  (if you are using redis storage)

Make sure you install those dependencies:

		$ npm install

## Configuration

### a) Define hosts and services to be monitored:

You need at least one service for each host. Define the ping service type for each host or service.

		//config/hosts.js

		//example of http ping for a host with 2 url's
		{
			name:'letsnode blog',
			host: 'letsnode.com',
			port:80,
			ping_interval: one_minute, //set ping interval (in seconds)
			ping_service_name: 'http', //if ping_service_name is not defined, 'http' is used by default
			failed_ping_interval: one_minute, //set ping interval if site is down (in seconds)
			enabled: true, //enables/disables this host
			alert_to: ['ivan@iloire.com'], //emails to alert if site goes down.
			warning_if_takes_more_than: 700, //miliseconds. alert if request takes more than this
			services : [
				{
					name : 'home',
					method: 'get',
					url : '/',
					//expected status code and expected string to be found in the response (otherwise will fail)
					expected: {statuscode: 200, contains: 'A blog about node.js and express.js'}
				} ,
				{
					name : 'contact page',
					method: 'get',
					url : '/contact',
					expected: {statuscode: 200, contains: 'Contact page'}
				}
			]
		} ,

		//example of smtp ping
		{
			name:'mydomain',
			host: 'mydomain.com',
			port:25,
			ping_interval: one_minute, //set ping interval (in seconds)
			ping_service_name: 'smtp',
			failed_ping_interval: one_minute,
			enabled: true,
			alert_to: ['ivan@iloire.com'], //emails to alert if site goes down.
			warning_if_takes_more_than: 700, //miliseconds. alert if request takes more than this
			services : [
				{
					name : 'home'
				}
			]
		}


### b) Define Postmark and notifications settings:

		//config/general.js

		module.exports.notifications = {
			enabled: false, //if disabled, no email will be sent (just console messages)
			to: 'ivan@iloire.com',
			postmark : {
				from: 'ivan@iloire.com',
				api_key : 'your-postmark-key-here'
			}
		}

### c) Configure the storage provider

		//config/storage.js

		module.exports = {

			//---------------------------
			// Select storage provider.
			// Supported providers: 'redis' (only redis at this time)
			//---------------------------
			provider : 'redis',

			options : {

				//---------------------------
				// redis configuration
				//---------------------------
				'redis' : {
					port: 1216,
					host: '127.0.0.1',
					db: 1
				}
			}
		};

## Run watchmen

### Run the monitor server

		$ node server.js

or more probably you would want to use **forever** to run it in the background

		$ forever start watchmen.js

### Run the web app to display status reports**

		$ forever start webserver/app.js 3000 #(where 3000 is the port you want to use).

# Tests

Run the tests with mocha:

		$ npm test


## History

**1.0apha1 Major changes and improvements**

- Storages are now plugable. Redis storage is used by default but you can create your own : couchdb, mongodb, text file, etc (see lib/storage).
- Ping services are now plugable. For now we have http and smtp (smtp is just checking tcp connection right now). You can create your own or improve the existent ones easily.
- Watchmen daemon now inherits from events.EventEmitter, so you can instanciate it and subscribe to the events of your choice (service_error, service_back, etc) to implement your custom logic (see server.js).
- Knockout.js has been removed. It uses handlebars instead. Faster, simpler code, avoid some client side memory leacks.
- Client side is using moment.js for rendering dates.
- Express routes now are handled on /routes
- Mocha is used for unit testing. Mocked storages and ping services are used.
- More features, less code. :-)
- Configuration is now in separate files, under /config directory
- Better reporting UI. **Uptime statistics**. Outages count, warnings count.

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

- Twitter integration (pipe events to a twitter account)
- Security (authentication for accesing the web UI and or editing stuff)
- Google charts
- Change configuration from control panel
- Reset stats from control panel
- Regular expressions support