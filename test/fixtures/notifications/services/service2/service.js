exports = module.exports = Service2;

function Service2 (config) {
    this.config = config;
}

Service2.prototype.getName = function() {
    return 'service 2'
};

Service2.prototype._send = function(options, cb) {
    cb();
};