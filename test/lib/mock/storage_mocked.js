var util = require ('util');

function StorageMocked(mocked_status){
  this.status = mocked_status;
}

exports = module.exports = StorageMocked;

util.inherits(StorageMocked, require ('../../../lib/storage/base'));

StorageMocked.prototype.get_status = function (service, callback){
  callback(null, this.status);
};

StorageMocked.prototype.set_status = function(status) {
  this.status = status;
}
