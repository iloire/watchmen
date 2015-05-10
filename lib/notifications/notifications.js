var defaultConfig = require('../../config/notifications/notifications');
var async = require('async');
var fs = require('fs');
var colors = require('colors');
var _ = require('lodash');

/**
 * Notifications Service
 */

var EMAIL_SUBJECT_PREFIX = '[watchmen]';

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

NotificationService.prototype.sendServiceDownAlert = function(service, state, cb) {
    this._send({
        to: this._getRecipients(service),
        title: EMAIL_SUBJECT_PREFIX + ' ' + service.name + ' is down!',
        body: service.name + ' is down!. Reason: ' + state.error
    }, cb || consoleOutputHandler);
};

/**
 * Send "service back up" alert to the registered notification services
 * @param service
 * @param cb
 */

NotificationService.prototype.sendServiceBackAlert = function(service, state, cb) {
    this._send({
        to: this._getRecipients(service),
        title: EMAIL_SUBJECT_PREFIX + ' ' + service.name + ' is back!',
        body: service.name + ' is back. Down for ' + state.down_time_last_request + ' seconds'
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

    var config = this.config;

    var concurrencyLimit = 10; // TODO extract somewhere

    if (errorsInConfig(config)){
        return cb('invalid configuration in NotificationService');
    }

    function send(notificationService, callback){
        notificationService.send(options, callback);
    }

    async.mapLimit(this.getEnabledServices(), concurrencyLimit, send, cb)
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
    return _.union(service.alert_to, alwaysToArray.map(function(s){ return s.trim(); }));
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

function errorsInConfig (config){
    if (!config.services) {
        return "list of services are required";
    }
    return null;
}

function getServicesFromConfig(servicesConfig) {
    return servicesConfig.map(function(serviceConfig){
        var serviceFactory = require(serviceConfig.path);
        var options = require(serviceConfig.config);
        return new serviceFactory(options);
    });
}
