module.exports = Service;

function Service(config) {
  this.config = config;
}

Service.prototype.getName = function () {
  return 'service 1';
};

Service.prototype.send = function (options, cb) {
  cb();
};