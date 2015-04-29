var util = require ('util');
var baseStorage = require ('../../../lib/storage/base');

function StorageMocked(mocked_status){
  this.status = mocked_status;
}

exports = module.exports = StorageMocked;

util.inherits(StorageMocked, baseStorage);

StorageMocked.prototype.get_status = function (service, callback) {
  var self = this;
  process.nextTick(function(){
    callback(null, self.status);
  });
};

StorageMocked.prototype.update_status = function (service, status, callback){
  process.nextTick(function(){
    callback(null);
  });
};

// used for testing only (synchronous)
StorageMocked.prototype.set_status = function(status) {
  this.status = status;
};

StorageMocked.prototype.flush_database = function (callback){
  process.nextTick(function(){
    callback(null);
  });
};

