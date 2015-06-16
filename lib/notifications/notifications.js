var async = require('async');
var fs = require('fs');
var colors = require('colors');
var _ = require('lodash');
var debug = require('debug')('notifications');
var defaultConfig = require('../../config/notifications/notifications');

/**
 * Notifications Service
 */

var EMAIL_SUBJECT_PREFIX = '[watchmen]';
var CONCURRENCY_LIMIT = 10;

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
    var options = {
        title: EMAIL_SUBJECT_PREFIX + ' ' + service.name + ' is down!',
        body: service.name + ' is down!. Reason: ' + state.error
    };
    this._sendAlertIfRequired(service, options, cb);
};

/**
 * Send "service back up" alert to the registered notification services
 * @param service
 * @param cb
 */

NotificationService.prototype.sendServiceBackAlert = function(service, outage, cb) {
    var options = {
        title: EMAIL_SUBJECT_PREFIX + ' ' + service.name + ' is back!',
        body: service.name + ' is back. Down for ' + outage.downtime
    };
    this._sendAlertIfRequired(service, options, cb);
};

/**
 * @params options.to: {Array} list of recipients
 * @params options.title: {string}
 * @params options.body: {string}
 * @params options.cb: {Function} callback.
 * @private
 */

NotificationService.prototype._send = function(options, cb){
    var config = this.config;

    if (errorsInConfig(config)){
        return cb('invalid configuration in NotificationService');
    }

    function send(notificationService, callback){
        debug('sending notification', options);
        notificationService.send(options, callback);
    }

    var enabledServices = this.getEnabledServices();
    if (!enabledServices.length) {
        debug('no enabled notification services found');
    }
    async.mapLimit(enabledServices, CONCURRENCY_LIMIT, send, function (err){
        cb(err, err ? null : 'notifications sent!');
    })
};

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
 * Send alert about a service with the provided options
 * @param service
 * @param options
 * @param cb
 * @returns {*|consoleOutputHandler}
 * @private
 */

NotificationService.prototype._sendAlertIfRequired = function (service, options, cb) {
    cb = cb || consoleOutputHandler;
    var alwaysToArray = (this.config.alwaysAlertTo ? this.config.alwaysAlertTo.split(",") : []);
    var recipients = this._getRecipients(service, alwaysToArray);
    if (recipients.length) {
        this._send({
            to: recipients,
            title: options.title,
            body: options.body
        }, cb);
    }
    else {
        debug('no recipients configured for ' + service.name);
        cb();
    }
    return cb;
};

/**
 * Get recipients for a service, taking in consideration global configuration
 * @param {Object} service
 * @returns {Array} list of recipients
 * @private
 */

NotificationService.prototype._getRecipients = function (service, alwaysAlertTo) {
    function trim (arr){
        return arr.map(function(s){ return s.trim()});
    }
    var serviceAlertTo = (service.alertTo || '').split(',');
    return _.union(trim(serviceAlertTo), trim(alwaysAlertTo)).filter(function(i){return i}); ;
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