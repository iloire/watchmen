var watchmen = require('../../lib/watchmen.js');
var redis_storage_class = require('../../lib/storage/providers/redis');
var mocked_ping_service = require('../../test/lib/mock/request_mocked');
var sinon = require('sinon');
var async = require('async');
var service_loader = require('../../lib/services');

var PING_INTERVAL = 1000 * 60; // ms
var NUMBER_PINGS_BACK = 15000;

var redis_storage = new redis_storage_class({port: 1216, host: '127.0.0.1', db: 1});
var _watchmen = new watchmen(null, redis_storage);

function getRandomResponse(service) {
  var err = Math.random() > 0.98 ? 'Error connecting with server - message' : null;
  var response = { statusCode: err ? 500 : 200 };
  var latency = (service.warning_if_takes_more_than - 500) + 700 * Math.random();
  return { error: err, body: 'body', response: response, timeDiff: latency };
}

function getPingData(service, n) {
  var currentTimestamp = +new Date() - PING_INTERVAL * n;
  var data = [];
  for (var i = 0; i < n; i++) {
    data.push({
      response: getRandomResponse(service),
      timestamp: currentTimestamp + PING_INTERVAL
    });
    currentTimestamp += PING_INTERVAL;
  }
  return data;
}

function generateDataForService(service, callback) {
  function ping(pingData, cb) {
    sinon.useFakeTimers(pingData.timestamp);
    service.ping_service = mocked_ping_service;

    mocked_ping_service.mocked_response = pingData.response;
    _watchmen.ping({ service: service }, function (err) {
      cb(err);
    });
  }

  var pingData = getPingData(service, NUMBER_PINGS_BACK);
  async.eachSeries(pingData, ping, function (err, results) {
    if (err) {
      console.error(err);
    }
    else {
      console.log('Data generated for service : ' + service.url_info)
    }
    callback(err);
  });
}

// main
service_loader.load_services(function (err, services) {
  if (err) {
    console.error('error loading services'.red);
    exit(1);
  }
  redis_storage.flush_database(function () {
    async.eachSeries(services, generateDataForService, function () {
      redis_storage.quit();
    });
  });
});

