var colors = require('colors');
var moment = require('moment');

var eventHandlers = {

  /**
   * On a new outage
   * @param service
   * @param state
   */

  onNewOutage: function (service, state) {
    var errorMsg = service.name + ' down!'.red;
    var nextAttempt = moment.duration(service.failedInterval, 'seconds');
    var retryingMsg = 'retrying in ' + nextAttempt.humanize();

    console.log(errorMsg, ' ', retryingMsg.gray);
  },

  /**
   * Failed ping on an existing outage
   * @param service
   * @param state
   */

  onCurrentOutage: function (service, state) {
    var errorMsg = service.name + ' down!'.red;
    var nextAttempt = moment.duration(state.failedInterval, 'seconds');
    var retryingMsg = '. retrying in ' + nextAttempt.humanize();

    console.log(errorMsg + retryingMsg.gray);
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
    console.log(service.name.white + ' is back'.green + '. Down for '.gray + duration.humanize().white);
  },

  /**
   * Service is responding correctly (pretty verbose output)
   * @param service
   * @param state
   */

  onServiceOk: function (service, state) {
    var serviceOkMsg = service.name + ' responded ' + 'OK!'.green;
    var responseTimeMsg = state.elapsedTime + ' milliseconds';
    console.log(serviceOkMsg, responseTimeMsg.gray);
  }
};

function ConsolePlugin(watchmen) {
  watchmen.on('new-outage', eventHandlers.onNewOutage);
  watchmen.on('current-outage', eventHandlers.onCurrentOutage);

  watchmen.on('latency-warning', eventHandlers.onLatencyWarning);
  watchmen.on('service-back', eventHandlers.onServiceBack);
  watchmen.on('service-ok', eventHandlers.onServiceOk);
}

exports = module.exports = ConsolePlugin;