var config = require('./config');
var util = require('util');
var email_service = require ('./lib/email');
var services_manager = require ('./lib/services');

var storage_factory = require ('./lib/storage/storage_factory');
var ping_service = require ('./lib/ping_services/http'); //http for now

var services = services_manager.load_services();

var error   = '\u001b[31m'; //red
var warning   = '\u001b[39m'; //yellow
var ok  = '\u001b[32m'; //green

var reset = '\u001b[0m';

function log_ok (str){
	console.log(ok + str + reset);
}

function log_error (str){
	console.log(error + str + reset);
}

function log_warning (str){
	console.log(warning + str + reset);
}

var WatchMen = require ('./lib/watchmen');
var storage = storage_factory.get_storage_instance();
var watchmen = new WatchMen(services, storage, ping_service);

//----------------------------------------------------
// Subscribe to service events
//----------------------------------------------------
watchmen.on('service_error', function(service, state){

	/*
	//Do here any additional stuff when you get an error

	var info = service.url_info + ' down!. Error: ' + state.error + '. Retrying in ' +
			(parseInt(state.next_attempt_secs, 10) / 60) + ' minute(s)..';

	log_error (info);
	*/

	if (state.prev_state.status != 1 && config.notifications.enabled){
		email_service.sendEmail(
				service.alert_to,
				service.url_info + ' is down!',
				service.url_info + ' is down!. Reason: ' + error
		);
	}
});

watchmen.on('service_warning', function(service, state){

	/*
	//Do here any additional stuff when you get a warning

	log_warning (service.url_info + ' WARNING (' + state.elapsed_time + ' ms, avg: '
			+ state.avg_response_time + ') ## ' + state.warnings + ' warnings');
	*/

});

watchmen.on('service_back', function(service, state){
	if (config.notifications.enabled){
		email_service.sendEmail(
				service.alert_to,
				service.url_info + ' is back!',
				service.url_info + ' ' +  service.msg
		);
	}
});

watchmen.on('service_ok', function(service, state){
	/*
	//Do here any additional stuff when you get a successful response

	log_ok (service.url_info + ' responded OK! (' + state.elapsed_time + ' milliseconds, avg: '
			+ state.avg_response_time + ')');
  */
});

//----------------------------------------------------
// Start watchmen
//----------------------------------------------------
watchmen.start();


//----------------------------------------------------
// Error handling
//----------------------------------------------------
process.on('uncaughtException', function(err) {
	console.error('uncaughtException:');
	console.error(err);
});

process.on('SIGINT', function () {
	console.log('stopping watchmen..');
	storage.quit();
	process.exit(0);
});