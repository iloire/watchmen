var async = require('async');

var debug = require('debug')('data-load');

var watchmen = require('../../lib/watchmen.js');
//var redis_storage_class = require ('./../../test/lib/mock/storage_mocked');
var redis_storage_class = require('../../lib/storage/providers/redis');
var mocked_ping_service = require('../../test/lib/mock/request_mocked');
var service_loader = require('../../lib/services');

var DEFAULT_PING_INTERVAL = 1000 * 60 * 1; // ms
var DEFAULT_NUMBER_DAYS_BACK = 90;
var DEFAULT_TARGET_UPTIME = 0.99;
var DEFAULT_TARGET_WARNING_PERCENTAGE = 0.02;

var redis_storage = new redis_storage_class({port: 1216, host: '127.0.0.1', db: 1});
var _watchmen = new watchmen(null, redis_storage);

function getRandomResponse(service) {
  var err = Math.random() >= DEFAULT_TARGET_UPTIME ? 'Error connecting with server - message' : null;
  var response = { statusCode: err ? 500 : 200 };
  var latency;
  if (Math.random() <= DEFAULT_TARGET_WARNING_PERCENTAGE) { // warning
    latency = Math.round((service.warning_if_takes_more_than) + (Math.random() * service.warning_if_takes_more_than));
  } else{
    latency = Math.round(service.warning_if_takes_more_than - service.warning_if_takes_more_than * Math.random());
  }
  return { error: err, body: 'body', response: response, timeDiff: latency };
}

function generateDataForService(service, callback) {

  var numberPingsBack = DEFAULT_NUMBER_DAYS_BACK * 1000 * 60 * 60 * 24 / DEFAULT_PING_INTERVAL;
  debug(numberPingsBack + ' pings back calculated for ' + service.url_info);
  var currentTimestamp = +new Date() - DEFAULT_PING_INTERVAL * numberPingsBack;
  debug('historical data starting at ' + new Date(currentTimestamp));
  var currentPing=0;

  service.ping_service = mocked_ping_service;

  for (var i = 0; i < numberPingsBack; i++) {
    mocked_ping_service.mocked_response = getRandomResponse(service);

    (function(timestamp){
    _watchmen.ping({ timestamp: timestamp, service: service }, function (err) {
      if (err) { return callback(err); }
      if (currentPing % 1000 == 0) {
        debug(new Date(timestamp), timestamp);
        debug('processing ', currentPing);
      }
      currentPing++;
      if (currentPing == numberPingsBack) {
          callback(null);
      }
    });
    })(currentTimestamp);

    currentTimestamp += DEFAULT_PING_INTERVAL;
  }
}

function run (programOptions) {

  function populatedata(services, cb){
    debug('database flushed');

    async.eachSeries(services, generateDataForService, function (err, results) {
      if (err) {
        console.error(err);
      }
      redis_storage.quit(cb);
    });
  }

  // main
  service_loader.load_services(function (err, services) {
    if (err) {
      console.error('error loading services'.red);
      process.exit(1);
    }

    if (programOptions.filter){
      services = services.filter(function(s){
        return s.url_info.indexOf(programOptions.filter) > -1;
      });
    }

    debug('program started');

    if (!programOptions.append){
      redis_storage.flush_database(function(){
        populatedata(services);
      });
    } else{
      populatedata(services);
    }
  });
}

var program = require('commander');
program
    .option('-f, --filter [filter]', 'Filter services to add dummy data to (by url_info)')
    .option('-a, --append', 'Do not reset database first. Be aware it may lead you to inconsistent states.')
    .parse(process.argv);

run (program);