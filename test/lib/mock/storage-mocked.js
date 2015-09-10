/**
 * Convenient Redis Storage mock for testing purposes
 */

var util = require ('util');

function StorageMocked(data){
  data = data || {};
  this.currentOutage = data.currentOutage;
}

exports = module.exports = StorageMocked;

StorageMocked.prototype.startOutage = function (service, outageData, callback) {
  this.currentOutage = outageData;
  process.nextTick(callback);
};

StorageMocked.prototype.getCurrentOutage = function (service, callback) {
  var self = this;
  process.nextTick(function(){
    callback(null, self.currentOutage);
  });
};

StorageMocked.prototype.saveLatency = function (service, timestamp, latency, cb) {
  process.nextTick(cb);
};

StorageMocked.prototype.archiveCurrentOutageIfExists = function (service, callback) {
  var self = this;
  process.nextTick(function(){
    callback(null, self.currentOutage);
  });
};

StorageMocked.prototype.flush_database = function (callback){
  process.nextTick(callback);
};

