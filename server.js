var colors = require('colors');
var notificationsFactory = require ('./lib/notifications/notifications');
var notificationService = new notificationsFactory();

var storageFactory = require('./lib/storage/storage_factory');
var storage = storageFactory.get_storage_instance();

require('./lib/services').load_services(function(err, services){

  if (err) {
    console.error('error loading services'.red);
    storage.quit();
    process.exit(0);
  }

  var WatchMen = require('./lib/watchmen');

  var watchmen = new WatchMen(services, storage);

  watchmen.on('service_error', function(service, state) {
    var errorMsg = service.url_info + ' down!. ' + state.error;
    var retryingMsg = '. retrying in ' + (parseInt(state.next_attempt_secs, 10) / 60) + ' minute(s)..';

    console.log (errorMsg + retryingMsg.gray);

    if (state.prev_state.status === 'success') {
      notificationService.sendServiceDownAlert(service, state.error);
    }
  });

  watchmen.on('service_warning', function(service, state) {
    /*
    // Do here any additional stuff when you get a warning

    console.log (service.url_info + ' WARNING (' + state.elapsed_time + ' ms, avg: '
        + state.avg_response_time + ') ## ' + state.warnings + ' warnings');
    */
  });

  watchmen.on('service_back', function(service, state) {
    notificationService.sendServiceBackAlert(service);
  });

  watchmen.on('service_ok', function(service, state) {
    /*
    console.log (service.url_info + ' responded OK! (' + state.elapsed_time + ' milliseconds, avg: '
        + state.avg_response_time + ')');
    */
  });

  //----------------------------------------------------
  // Start watchmen
  //----------------------------------------------------
  watchmen.start();
  console.log('watchmen monitor started'.gray);
});


//----------------------------------------------------
// Web server
//----------------------------------------------------
// You can launch the webserver in a separate process by doing:  node webserver/app.js
//  - or - 
// you can just uncomment the following line to launch both the monitor and the web server 
// in the same process:
// require('./webserver/app');

process.on('uncaughtException', function(err) {
  console.error('uncaughtException:');
  console.error(err);
});

process.on('SIGINT', function () {
  console.log('stopping watchmen..'.gray);
  storage.quit();
  process.exit(0);
});