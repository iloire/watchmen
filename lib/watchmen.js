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

  if (!service.pingService) {
    var pingFactory = require('watchmen-ping-' + service.pingServiceName);
    service.pingService = new pingFactory();
  }

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

WatchMen.prototype._launch = function (service) {
  var self = this;
  this.ping({service: service}, function (err, nextDelay) {
    if (err) {
      console.error(err);
    }
    if (service.running) {
      setTimeout(function () {
        self._launch(service);
      }, nextDelay);
    }
  });
};

/**
 * Starts all
 */

WatchMen.prototype.startAll = function () {
  var self = this;
  this.services.forEach(function (s) {
    if (!s.running) {
      s.running = true;
      self._launch(s);
    }
  });
};

/**
 * Starts one service
 */

WatchMen.prototype.start = function (id) {
  var service = this.getServiceById(id);
  if (service && !service.running) {
    service.running = true;
    this._launch(service);
  }
};

/**
 * Stops one service
 */

WatchMen.prototype.stop = function (id) {
  var service = this.getServiceById(id);
  if (service) {
    service.running = false;
  }
};

/**
 * Add service to the list of running services
 */

WatchMen.prototype.addService = function (service) {
  this.services.push(service);
  this.start(service.id);
};

/**
 * Get service by id
 * @param serviceId
 * @returns {object} Service
 */

WatchMen.prototype.getServiceById = function (id) {
  return this.services.filter(function (s) {
    return s.id == id;
  })[0];
};

