var defaultConfig = require('../../config/notifications');
var async = require('async');

/**
 * Notifications Service
 */

exports = module.exports = NotificationService;

function NotificationService(config) {
    this.config = config || defaultConfig;
}

/**
 * @params options.to: {Array} list of recipients
 * @params options.title: {string}
 * @params options.body: {string}
 * @params options.cb: {Function} callback.
 */

NotificationService.prototype.send = function(options, cb) {

    cb = cb || consoleOutputHandler;

    var concurrencyLimit = 10; // TODO extract somewhere

    if (validConfig(this.config)){
        return cb('invalid configuration in NotificationService');
    }

    function send(service, cb){
        service.send(options, cb);
    }

    var notificationServicesEnabled = this.config.services.filter(function (serviceConfig) {
        return serviceConfig.enabled;
    }).map(function(serviceConfig){
        var serviceFactory = require(serviceConfig.path);
        var options = require(serviceConfig.config);
        return new serviceFactory(options);
    });

    async.mapLimit(notificationServicesEnabled, concurrencyLimit, send, cb)
}

/**
 * Send "down" alert to the registered notification services
 * @param service
 * @param err
 * @param cb
 */

NotificationService.prototype.sendServiceDownAlert = function(service, err, cb) {
    this.send({
        to: service.alert_to,
        title: service.url_info + ' is down!',
        body: service.url_info + ' is down!. Reason: ' + err
    }, cb || consoleOutputHandler);
}

/**
 * Send "service back up" alert to the registered notification services
 * @param service
 * @param cb
 */

NotificationService.prototype.sendServiceBackAlert = function(service, cb) {
    this.send({
        to: service.alert_to,
        title: service.url_info + ' is back!',
        body: service.url_info + ' ' + service.msg
    }, cb || consoleOutputHandler);
}

/**
 * Console output callback handler
 * @param err
 */

function consoleOutputHandler (err){
    if (err) {
        console.error(err);
    }
}

/**
 * Returns error if invalid configuration. Otherwise it returns null
 * @param config
 * @returns {string} errors or null if ok
 */
function validConfig (config){
    if (!config.services) {
        return "list of services are required";
    }
    return;
}

