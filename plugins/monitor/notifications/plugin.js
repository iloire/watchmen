var notificationsFactory = require('../../../lib/notifications/notifications');
var notificationService = new notificationsFactory();

var eventHandlers = {

  /**
   * On a new outage
   * @param service
   * @param state
   */

  onNewOutage: function (service, state) {
    notificationService.sendServiceDownAlert(service, state);
  },

  /**
   * Service is back up online
   * @param service
   * @param state
   */

  onServiceBack: function (service, currentOutage) {
    notificationService.sendServiceBackAlert(service, {}); // TODO: check second parameter (it was state)
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
      exit(1);
    }
  });
}

exports = module.exports = NotificationsPlugin;