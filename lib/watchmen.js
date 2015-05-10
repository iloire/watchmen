var events = require('events');
var moment = require('moment');
var debug = require('debug')('watchmen');
var util = require('util');

exports = module.exports = WatchMen;

/**
 * Watchmen service
 * @param services {Array} list of services to ping
 * @param storage {Object} storage instance
 * @constructor
 */

function WatchMen(services, storage) {
  this.storage = storage;
  this.services = services;
  this.daemon_status = 0; //0=stopped, 1=running
}

util.inherits(WatchMen, events.EventEmitter);

/**
 * Ping service
 * @param params.service {Object} service object
 * @param callback {Function} ping result callback
 */

WatchMen.prototype.ping = function (params, callback) {

  var self = this;
  var storage = self.storage;
  var service = params.service;

  debug('pinging ' + service.name);

  service.pingService.ping(service, function (error, body, response, elapsedTime) {

    var timestamp = +new Date();

    self.emit('ping', service, {elapsedTime: elapsedTime});

    if (error) {

      /**
       * Ops, ping failed!
       */

      debug('error', error);


      storage.getCurrentOutage(service, function (err, outage) {
        if (err) {
          return callback(err);
        }

        if (!outage) {

          /**
           * First failure
           */

          var outageData = {
            timestamp: timestamp,
            error: error
          };

          storage.startOutage(service, outageData, function (err) {
            if (err) {
              return callback(err);
            }

            self.emit('new-outage', service, outageData);
            callback(null, service.failureInterval);
          });

        } else {

          /**
           * Not the first ping failure for this outage
           */

          self.emit('current-outage', service, outage);
          callback(null, service.failureInterval);
        }
      });

    } else {

      /**
       * (thumbsup), ping succeed!
       */

      debug('success');

      var limit = service.warningThreshold;
      if (limit && (elapsedTime > limit)) { //over the limit. warning!
        self.emit('latency-warning', service, {elapsedTime: elapsedTime});
      }

      storage.saveLatency(service, timestamp, elapsedTime, function (err) {
        if (err) {
          return callback(err);
        }

        debug('latency was', elapsedTime);

        storage.archiveCurrentOutageIfExists(service, function (err, currentOutage) {
          if (err) {
            return callback(err);
          }

          if (currentOutage) {
            debug('emit current outage');
            self.emit('service-back', service, currentOutage);
          }

          self.emit('service-ok', service, {elapsedTime: elapsedTime});

          callback(null, service.interval);
        });
      });
    }

  });
};

/**
 * Starts the service
 */

WatchMen.prototype.start = function () {
  var self = this;
  self.daemon_status = 1;

  function launch(service) {
    self.ping({service: service}, function (err, nextDelay) {
      if (err) {
        console.error(err);
      }

      if (self.daemon_status) { // still active
        setTimeout(launch, nextDelay, service); // TODO: 3 parameters here?
      }
    });
  }

  this.getEnabledServices().forEach(function (service) {
    launch(service);
  });
};

/**
 * Stops the service
 */

WatchMen.prototype.stop = function () {
  this.daemon_status = 0;
  console.log('stopping watchmen...');
};

/**
 * Get services marked as enabled
 * @returns {Array.<{Object}>} services
 */

WatchMen.prototype.getEnabledServices = function () {
  return this.services.filter(function (service) {
    return service.enabled !== false;
  });
};