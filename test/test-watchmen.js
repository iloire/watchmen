var sinon = require('sinon');
var assert = require('assert');

var Watchmen = require('../lib/watchmen');
var mockedStorage = require('./lib/mock/storage-mocked');
var mockedPing = require('./lib/mock/request-mocked');

describe('watchmen', function () {

  var ERROR_RESPONSE = {error: 'mocked error', body: null, response: null, latency: 0};
  var SUCCESS_RESPONSE = {error: null, body: 'ok', response: {body: 'ok', statusCode: 200}, latency: 300};
  var LATENCY_WARNING_RESPONSE = {error: null, body: 'ok', response: {body: 'ok', statusCode: 200}, latency: 1600};
  var INITIAL_TIME = 946684800;

  var service;
  var clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers(946684800);
    service = {
      host: {host: 'www.correcthost.com', port: '80', name: 'test'},
      url: '/',
      interval: 4 * 1000,
      failureInterval: 5 * 1000,
      warningThreshold: 1500,
      pingService: mockedPing
    };
  });

  after(function (done) {
    clock.restore();
    done();
  });

  it('should emit "new-outage" when ping fails for the first time', function (done) {
    mockedPing.mockedResponse = ERROR_RESPONSE;
    var failedTimestamp = +new Date();

    var watchmen = new Watchmen([service], new mockedStorage());
    watchmen.on('new-outage', function (service, outageData) {
      assert.equal(outageData.error, 'mocked error', 'should have error property');
      assert.equal(outageData.timestamp, failedTimestamp, 'should have timestamp property');
      done(null);
    });
    watchmen.ping({service: service, timestamp: failedTimestamp}, function (err) {
    });
    clock.tick(ERROR_RESPONSE.latency);
  });

  it('should emit "current-outage" when ping fails for the second and more times', function (done) {
    mockedPing.mockedResponse = ERROR_RESPONSE;
    var failedTimestamp = +new Date();
    var called = false;
    var watchmen = new Watchmen([service], new mockedStorage());
    watchmen.on('current-outage', function (service, outageData) {
      assert.equal(outageData.error, 'mocked error', 'should have error property');
      assert.equal(outageData.timestamp, failedTimestamp, 'should have timestamp property');
      called = true;
    });
    watchmen.ping({service: service, timestamp: failedTimestamp}, function () {
      watchmen.ping({service: service, timestamp: failedTimestamp}, function () {
        done(called ? null : 'current-outage was not called');
      });
      clock.tick(ERROR_RESPONSE.latency);
    });
    clock.tick(ERROR_RESPONSE.latency);
  });

  it('should emit "service-ok" when ping success', function (done) {
    mockedPing.mockedResponse = SUCCESS_RESPONSE;
    var watchmen = new Watchmen([service], new mockedStorage(null));
    watchmen.on('service-ok', function (service, data) {
      assert.equal(data.elapsedTime, 300);
      done();
    });
    watchmen.ping({service: service}, function (err) {
    });
    clock.tick(SUCCESS_RESPONSE.latency);
  });

  it('should always emit "ping" after a ping', function (done) {
    mockedPing.mockedResponse = SUCCESS_RESPONSE;
    var watchmen = new Watchmen([service], new mockedStorage(null));
    watchmen.on('ping', function (service, data) {
      assert.equal(data.elapsedTime, 300);
      done();
    });
    watchmen.ping({service: service}, function (err) {
    });
    clock.tick(SUCCESS_RESPONSE.latency);
  });

  it('should emit "service-back" when service is back', function (done) {
    mockedPing.mockedResponse = SUCCESS_RESPONSE;
    var currentOutage = {
      timestamp: +new Date(),
      error: 'some error'
    };

    var watchmen = new Watchmen([service], new mockedStorage({currentOutage: currentOutage}));
    watchmen.on('service-back', function (service, outageData) {
      assert.equal(outageData.timestamp, INITIAL_TIME);
      done();
    });
    watchmen.ping({service: service}, function (err) {
    });
    clock.tick(SUCCESS_RESPONSE.latency);
  });

  it('should emit "warning" when ping takes too long', function (done) {
    mockedPing.mockedResponse = LATENCY_WARNING_RESPONSE;
    var watchmen = new Watchmen([service], new mockedStorage(null));
    watchmen.on('latency-warning', function (service, data) {
      assert.equal(data.elapsedTime, 1600);
      done();
    });
    watchmen.ping({service: service}, function (err) {
    });
    clock.tick(LATENCY_WARNING_RESPONSE.latency);
  });

  it('should start a service by ID', function (done) {
    var watchmen = new Watchmen([service], new mockedStorage(null));
    watchmen._launch = function(service){
      assert.equal(service.running, true);
      done();
    };
    watchmen.start();
  });

  it('start should not throw errors if there are not services', function (done) {
    var watchmen = new Watchmen([], new mockedStorage(null));
    watchmen._launch = function(){
      done('not called');
    };
    watchmen.start();
    done();
  });

  it('stop should not throw errors if there are not services', function (done) {
    var watchmen = new Watchmen([], new mockedStorage(null));
    watchmen.stop();
    done();
  });

});