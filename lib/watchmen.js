var events = require('events');

exports = module.exports = WatchMen;

/**
 * Watchmen service
 * @param services {Array} list of services to ping
 * @param storage {Object} storage instance
 * @param options {Object} options
 * @constructor
 */

function WatchMen(services, storage, options){
  this.storage = storage;
  this.services = services;
  this.daemon_status = 0; //0=stopped, 1=running
}

require('util').inherits(WatchMen, events.EventEmitter);

/**
 * Ping service
 * @param params.service {Object} service object
 * @param callback {Function} ping result callback
 */

WatchMen.prototype.ping = function (params, callback){

  var self = this;

  var timestamp = params.timestamp || +new Date(); //allow timestamp injection for easy testing

  params.service.ping_service.ping (params.service, function(error, body, response, elapsed_time){

    self.storage.get_status (params.service, function (err, prev_state) {
      if (err) { return callback(err);}

      function add_event(status, msg, type) {
        var event = {status: status, msg: msg, timestamp: timestamp, type: type};
        state.events.push(event);
      }

      prev_state = prev_state || {};
      delete prev_state.prev_state; //make sure we don't store nested state

      var state = getNewState(prev_state, elapsed_time, timestamp);

      state.uptime = calculateUptime(timestamp, state);

      if (error) { // service is down

        state.status = "error";
        state.error = error;
        state.next_attempt_secs = params.service.failed_ping_interval;

        // record event and outage only if this is the first error for this service.
        if (prev_state.status !== "error") {
          state.up_since = null;
          state.down_timestamp = timestamp;
          state.outages = (parseInt(prev_state.outages, 10) || 0) + 1; //inc outages
          state.last_outage = timestamp;

          add_event('error', state.error, 'critical');
          self.emit('service_error', params.service, state);
        }
      }  else { // service is up

        state.status = "success";
        state.next_attempt_secs = params.service.ping_interval;
        state.up_since = state.up_since || timestamp;

        state.avg_response_time = Math.round(
            (state.avg_response_time * state.ok_responses_count + elapsed_time) /
            (parseInt(state.ok_responses_count || 0, 10) + 1)
        );

        state.ok_responses_count++;

        state.last_ok = timestamp;

        // response over the threshold?
        var limit = params.service.warning_if_takes_more_than;
        if (limit && (elapsed_time > limit)) { //over the limit. warning!
          state.last_warning = timestamp;
          state.warnings = (parseInt(prev_state.warnings, 10) || 0) + 1; //inc warnings
          add_event('warning', elapsed_time + ' ms (over the ' + limit + ' ms latency threshold)', 'warning');
          self.emit('service_warning', params.service, state);
        }

        // if previous state was "error", emit "service is back"
        if (prev_state.status === "error") { //service was down and now it is up again!
          state.down_time_last_request = Math.round((timestamp - prev_state.down_timestamp) / 1000); // in sec
          state.down_time_acc = (parseInt(state.down_time_acc, 10) || 0) + state.down_time_last_request; //accumulated downtime
          state.down_timestamp = null;
          add_event('success', 'service is back! Downtime: ' + state.down_time_last_request + ' seconds', 'critical');
          self.emit('service_back', params.service, state);
        }
        else { //everything ok.
          state.down_time_last_request = null;
          self.emit('service_ok', params.service, state);
        }
      }

      self.storage.update_status(params.service, state, function (err) {
        callback(err, state);
      });

    });
  });
 };

/**
 * Starts the service
 */

WatchMen.prototype.start = function (){
  var self = this;
  self.daemon_status = 1;

  function launch (service){
   self.ping ({service:service}, function (err, state){
    if (err){ console.error (err); }

    if (self.daemon_status) { // still active
     setTimeout(launch, parseInt(state.next_attempt_secs, 10) * 1000, service);
    }
   });
  }

  this.getEnabledServices().forEach(function(service){
   launch(service);
  });
};

/**
 * Stops the service
 */

WatchMen.prototype.stop = function (){
 this.daemon_status = 0;
 console.log('stopping watchmen...');
};

/**
 * Get services marked as enabled
 * @returns {Array.<{Object}>} services
 */

WatchMen.prototype.getEnabledServices = function (){
  return this.services.filter(function(service){
    return service.enabled !== false;
  });
};

function getNewState(prev_state, elapsed_time, timestamp) {
  return {
    last_check: timestamp,
    elapsed_time : elapsed_time,
    timestamp : timestamp,
    events: [],

    outages : prev_state.outages || 0,
    warnings: prev_state.warnings || 0,
    prev_state : prev_state,
    last_outage: prev_state.last_outage,
    last_warning: prev_state.last_warning,
    last_ok: prev_state.last_ok,
    down_time_acc : prev_state.down_time_acc || 0 ,
    down_timestamp : prev_state.down_timestamp,
    up_since: prev_state.up_since || timestamp,

    avg_response_time: prev_state.avg_response_time || 0,
    ok_responses_count : prev_state.ok_responses_count || 0,
    running_since: prev_state.running_since || timestamp
  };
}

function calculateUptime(timestamp, state) {
  var running = (timestamp - state.running_since) / 1000; //seconds
  var downtime = state.down_time_acc || 0;
  if (state.down_timestamp) {
    downtime += (timestamp - state.down_timestamp) / 1000;
  }
  return (Math.round((100000 * (running - downtime)) / running) / 1000) || 0;
}