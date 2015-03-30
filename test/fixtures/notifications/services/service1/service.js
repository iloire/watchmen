exports = module.exports = Service;

function Service (config) {
    this.config = config;
}

Service.prototype.send = function(options, cb) {
    cb();
}