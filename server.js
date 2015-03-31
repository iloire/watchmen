var colors = require('colors');
var notificationsFactory = require ('./lib/notifications/notifications');
var notificationService = new notificationsFactory();

var storageFactory = require('./lib/storage/storage_factory');
var storage = storageFactory.get_storage_instance();

var eventHandlers = {

  /**
   * When there is an error pinging the service
   * @param service
   * @param state
   */

  onServiceError: function(service, state) {
    var errorMsg = service.url_info + ' down!. ' + state.error.red;
    var retryingMsg = '. retrying in ' + (parseInt(state.next_attempt_secs, 10) / 60) + ' minute(s)..';

    console.log (errorMsg + retryingMsg.gray);

    if (state.prev_state.status === 'success') {
      notificationService.sendServiceDownAlert(service, state.error);
    }
  },

  /**
   * Warning alert pinging the service
   * @param service
   * @param state
   */

  onServiceWarning: function (service, state) {
    /*
     // Do here any additional stuff when you get a warning

     console.log (service.url_info + ' WARNING (' + state.elapsed_time + ' ms, avg: '
     + state.avg_response_time + ') ## ' + state.warnings + ' warnings');
     */
  },

  /**
   * Service is back up online
   * @param service
   * @param state
   */

  onServiceBack: function (service, state) {
    notificationService.sendServiceBackAlert(service);
  },

  /**
   * Service is responding correctly (pretty verbose output)
   * @param service
   * @param state
   */

  onServiceOk: function (service, state) {

    /*
    var serviceOkMsg = service.url_info + ' responded ' + 'OK!'.green;
    var responseTimeMsg = state.elapsed_time + ' milliseconds, avg: '
        + state.avg_response_time;

    console.log (serviceOkMsg, responseTimeMsg.gray);
    */
  }
};

function start (services, storage) {

  var WatchMenFactory = require('./lib/watchmen');

  var watchmen = new WatchMenFactory(services, storage);

  watchmen.on('service_error', eventHandlers.onServiceError);
  watchmen.on('service_warning', eventHandlers.onServiceWarning);
  watchmen.on('service_back', eventHandlers.onServiceBack);
  watchmen.on('service_ok', eventHandlers.onServiceOk);

  watchmen.start();

  console.log('watchmen monitor started'.gray);

  // notification services info:
  notificationService.getEnabledServices().forEach(function(s){
    console.log('', s.getName(), ' notification service is enabled'.gray);
    var configErrors = s.checkConfiguration();
    if (configErrors) {
      console.error(configErrors.red);
      exit(1);
    }
  });
}

require('./lib/services').load_services(function(err, services){
  if (err) {
    console.error('error loading services'.red);
    exit(1);
  }
  start(services, storage);
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
  exit(1);
});

process.on('SIGINT', function () {
  console.log('stopping watchmen..'.gray);
  exit(0);
});

function exit (code) {
  storage.quit();
  process.exit(code);
}