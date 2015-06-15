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
  setImmediate(function(){
    callback(null);
  });
};

StorageMocked.prototype.getCurrentOutage = function (service, callback) {
  var self = this;
  setImmediate(function(){
    callback(null, self.currentOutage);
  });
};

StorageMocked.prototype.saveLatency = function (service, timestamp, latency, callback) {
  setImmediate(function(){
    callback(null);
  });
};

StorageMocked.prototype.archiveCurrentOutageIfExists = function (service, callback) {
  var self = this;
  setImmediate(function(){
    callback(null, self.currentOutage);
  });
};

StorageMocked.prototype.flush_database = function (callback){
  setImmediate(function(){
    callback(null);
  });
};

