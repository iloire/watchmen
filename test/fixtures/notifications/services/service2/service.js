exports = module.exports = Service2;

function Service2 (config) {
    this.config = config;
}

Service2.prototype.send = function(options, cb) {
    cb();
}