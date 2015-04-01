exports = module.exports = Service;

function Service (config) {
    this.config = config;
}

Service.prototype.getName = function() {
    return 'service 1'
};

Service.prototype._send = function(options, cb) {
    cb();
};