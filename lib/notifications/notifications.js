var defaultConfig = require('../../config/notifications/notifications');
var async = require('async');
var fs = require('fs');
var colors = require('colors');
var _ = require('lodash');

/**
 * Notifications Service
 */

exports = module.exports = NotificationService;

function NotificationService(config) {
    this.config = config || defaultConfig;
}

/**
 * Send "down" alert to the registered notification services
 * @param service
 * @param err
 * @param cb
 */

NotificationService.prototype.sendServiceDownAlert = function(service, err, cb) {
    this._send({
        to: this._getRecipients(service),
        title: service.url_info + ' is down!',
        body: service.url_info + ' is down!. Reason: ' + err
    }, cb || consoleOutputHandler);
};

/**
 * Send "service back up" alert to the registered notification services
 * @param service
 * @param cb
 */

NotificationService.prototype.sendServiceBackAlert = function(service, cb) {
    this._send({
        to: this._getRecipients(service),
        title: service.url_info + ' is back!',
        body: service.url_info + ' ' + service.msg
    }, cb || consoleOutputHandler);
};

/**
 * @params options.to: {Array} list of recipients
 * @params options.title: {string}
 * @params options.body: {string}
 * @params options.cb: {Function} callback.
 * @private
 */

NotificationService.prototype._send = function(options, cb){

    cb = cb || consoleOutputHandler;

    var concurrencyLimit = 10; // TODO extract somewhere

    if (validConfig(this.config)){
        return cb('invalid configuration in NotificationService');
    }

    function send(service, callback){
        service.send(options, callback);
        if (config.logTo) {
            appendToFile('\n ' + new Date() + ' Notification sent to ' + options.to +
            ' with service: ' + service.config.name, config.logTo);
        }
    }

    async.mapLimit(notificationServices, concurrencyLimit, send, cb)
}

/**
 * Get enable services
 * @returns {Array} enabled services
 */
NotificationService.prototype.getEnabledServices = function() {
    return getServicesFromConfig(this.config.services.filter(function (serviceConfig) {
        return serviceConfig.enabled;
    }));
};

/**
 * Get recipients for a service, taking in consideration global configuration
 * @param {Object} service
 * @returns {Array} list of recipients
 * @private
 */
NotificationService.prototype._getRecipients = function (service) {
    var alwaysToArray = (this.config.alwaysAlertTo ? this.config.alwaysAlertTo.split(",") : []);
    return _.union(service.alert_to, alwaysToArray);
};


/**
 * Console output callback handler
 * @param err
 */

function consoleOutputHandler (err){
    if (err) {
        console.error(err.red);
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
    return null;
}

/**
 * Append log text into a file
 * @param msg
 * @param path
 * @param cb
 */
function appendToFile (msg, path, cb) {
    fs.appendFile(path, msg, cb || function (err) {
        if (err) {
            console.error(err);
        }
    });
}

function getServicesFromConfig(servicesConfig) {
    return servicesConfig.map(function(serviceConfig){
        var serviceFactory = require(serviceConfig.path);
        var options = require(serviceConfig.config);
        return new serviceFactory(options);
    });
}
