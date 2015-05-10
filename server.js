var colors = require('colors');
var moment = require('moment');
var notificationsFactory = require ('./lib/notifications/notifications');
var notificationService = new notificationsFactory();

var storageFactory = require('./lib/storage/storage-factory');
var storage = storageFactory.getStorageInstance('development'); // TODO: correct flag according to env
var WatchMenFactory = require('./lib/watchmen');

var eventHandlers = {

  /**
   * On a new outage
   * @param service
   * @param state
   */

  onNewOutage: function(service, state) {
    var errorMsg = service.name + ' down!'.red;
    var nextAttempt = moment.duration(service.failedInterval, 'seconds');
    var retryingMsg = 'retrying in ' + nextAttempt.humanize();

    console.log (errorMsg, ' ', retryingMsg.gray);

    notificationService.sendServiceDownAlert(service, state);
  },

  /**
   * Failed ping on an existing outage
   * @param service
   * @param state
   */

  onCurrentOutage: function(service, state) {
    var errorMsg = service.name + ' down!'.red;
    var nextAttempt = moment.duration(state.failedInterval, 'seconds');
    var retryingMsg = '. retrying in ' + nextAttempt.humanize();

    console.log (errorMsg + retryingMsg.gray);
  },

  /**
   * Warning alert pinging the service
   * @param service
   * @param state
   */

  onLatencyWarning: function (service, elapsedTime) { // TODO unit test elapsedTime
    /*
     Do here any additional stuff when you get a warning
     */
  },

  /**
   * Service is back up online
   * @param service
   * @param state
   */

  onServiceBack: function (service, currentOutage) {
    var duration = moment.duration(+new Date() - currentOutage.timestamp, 'seconds');
    console.log (service.name.white +  ' is back'.green + '. Down for '.gray + duration.humanize().white);
    notificationService.sendServiceBackAlert(service, {}); // TODO: check second parameter (it was state)
  },

  /**
   * Service is responding correctly (pretty verbose output)
   * @param service
   * @param state
   */

  onServiceOk: function (service, state) {
    var serviceOkMsg = service.name + ' responded ' + 'OK!'.green;
    var responseTimeMsg = state.elapsedTime + ' milliseconds';
    console.log (serviceOkMsg, responseTimeMsg.gray);
  }
};

function start (services, storage) {

  var watchmen = new WatchMenFactory(services, storage);

  watchmen.on('new-outage', eventHandlers.onNewOutage);
  watchmen.on('current-outage', eventHandlers.onCurrentOutage);

  watchmen.on('latency-warning', eventHandlers.onLatencyWarning);
  watchmen.on('service-back', eventHandlers.onServiceBack);
  watchmen.on('service-ok', eventHandlers.onServiceOk);

  watchmen.start();

  console.log('watchmen has started'.gray);

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

storage.getServices({}, function(err, services){
  if (err) {
    console.error('error loading services'.red);
    exit(1);
  }

  // inject pingService
  services.map(function(service) {
    service.pingServiceName = 'http'; // TODO temp
    service.pingService = require('./lib/ping_services/' + service.pingServiceName);
  });

  console.error(services.length + ' services loaded'.gray);
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

process.on('SIGINT', function () {
  console.log('stopping watchmen..'.gray);
  storage.quit();
  process.exit(0);
});

function exit (code) {
  storage.quit();
  process.exit(code);
}