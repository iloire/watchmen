var debug = require('debug')('notifications');
var notificationsFactory = require('../../../lib/notifications/notifications');
var notificationService = new notificationsFactory();

var eventHandlers = {

  /**
   * On a new outage
   * @param service
   * @param state
   */

  onNewOutage: function (service, state) {
    debug('triggering "onNewOutage" notification');
    notificationService.sendServiceDownAlert(service, state, function(err){
      if (err){
        console.error(err);
      }
    });
  },

  /**
   * Service is back up online
   * @param service
   * @param state
   */

  onServiceBack: function (service, currentOutage) {
    debug('triggering "onServiceBack" notification');
    notificationService.sendServiceBackAlert(service, currentOutage, function(err){
      if (err){
        console.error(err);
      }
    });
  }
};

function NotificationsPlugin(watchmen) {
  watchmen.on('new-outage', eventHandlers.onNewOutage);
  watchmen.on('service-back', eventHandlers.onServiceBack);

  // notification services info:
  notificationService.getEnabledServices().forEach(function (s) {
    console.log('', s.getName(), ' notification service is enabled'.gray);
    var configErrors = s.checkConfiguration();
    if (configErrors) {
      console.error(configErrors.red);
      process.exit(1);
    }
  });
}

exports = module.exports = NotificationsPlugin;