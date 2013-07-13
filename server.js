var config = require('./config/general');
var email_service = require ('./lib/notifications/email/email');
var services = require('./lib/services').load_services();

//----------------------------------------------------
// Fetch storage
//----------------------------------------------------
var storage_factory = require('./lib/storage/storage_factory');
var storage = storage_factory.get_storage_instance();

//----------------------------------------------------
// Create watchmen instance
//----------------------------------------------------
var WatchMen = require('./lib/watchmen');
var watchmen = new WatchMen(services, storage);

//----------------------------------------------------
// Subscribe to service events
//----------------------------------------------------
watchmen.on('service_error', function(service, state) {

  /*
  //Do here any additional stuff when you get an error
  */
  var info = service.url_info + ' down!. Error: ' + state.error + '. Retrying in ' +
      (parseInt(state.next_attempt_secs, 10) / 60) + ' minute(s)..';

  console.log (info);

  if (state.prev_state.status === 'success' && config.notifications.enabled) {
    email_service.sendEmail(
        service.alert_to,
        service.url_info + ' is down!',
        service.url_info + ' is down!. Reason: ' + state.error
    );
  }
});

watchmen.on('service_warning', function(service, state) {

  /*
  //Do here any additional stuff when you get a warning

  console.log (service.url_info + ' WARNING (' + state.elapsed_time + ' ms, avg: '
      + state.avg_response_time + ') ## ' + state.warnings + ' warnings');
  */

});

watchmen.on('service_back', function(service, state) {
  if (config.notifications.enabled){
    email_service.sendEmail(
        service.alert_to,
        service.url_info + ' is back!',
        service.url_info + ' ' +  service.msg
    );
  }
});

watchmen.on('service_ok', function(service, state) {
  /*
  //Do here any additional stuff when you get a successful response

  console.log (service.url_info + ' responded OK! (' + state.elapsed_time + ' milliseconds, avg: '
      + state.avg_response_time + ')');
  */
});

//----------------------------------------------------
// Start watchmen
//----------------------------------------------------
watchmen.start();

//----------------------------------------------------
// Web server
//----------------------------------------------------
// You can launch the webserver in a separate process by doing:  node webserver/app.js
//  - or - 
// you can just uncomment the following line to launch both the monitor and the web server 
// in the same process:

//require('./webserver/app');

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