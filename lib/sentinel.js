var _ = require('lodash');

/**
 * Watches for changes in services and start/stops services when they get added, deleted or disabled
 */

function Sentinel(storage, watchmen, options) {
  this.options = options || {};
  this.storage = storage;
  this.watchmen = watchmen;
}

exports = module.exports = Sentinel;

var DEFAULT_INTERVAL = 5000;

var timeoutId = null;

Sentinel.prototype._findAdded = function (databaseServices, runningServices) {
  var added = [];
  databaseServices.forEach(function (s) {
    if (!_.find(runningServices, function (rs) {
          return rs.id == s.id;
        })) {
      added.push(s);
    }
  });
  return added;
};

Sentinel.prototype._findRemoved = function (databaseServices, runningServices) {
  var removed = [];
  runningServices.forEach(function (s) {
    if (!_.find(databaseServices, function (rs) {
          return rs.id == s.id;
        })) {
      removed.push(s);
    }
  });
  return removed;
};

Sentinel.prototype._tick = function () {

  var self = this;
  this.storage.getServices({}, function (err, services) {

    var newServices = self._findAdded(services, self.watchmen.services);
    if (newServices.length) {
      newServices.forEach(function (service) {
        console.log('service added: ', service.name);
        self.watchmen.addService(service);
      });
    }

    var removedServices = self._findRemoved(services, self.watchmen.services);
    if (removedServices.length) {
      removedServices.forEach(function (s) {
        if (!s.running) {
          console.log('service stopped: ', s.name);
          self.watchmen.stop(s.id);
        }
      });
    }

    // 4. compare and gets the ones to disable
    // 5. the ones to enable
  });
};

Sentinel.prototype.watch = function () {
  var self = this;
  clearInterval(timeoutId);
  timeoutId = setInterval(function () {
    self._tick();
  }, this.options.interval || DEFAULT_INTERVAL);
};

