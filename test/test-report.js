var assert = require('assert');
var async = require('async');
var sinon = require('sinon');
var redisStorage_class = require('../lib/storage/providers/redis');
var reportService = require('../lib/reporter');
var populator = require('./lib/util/populator');
var dummyServiceGenerator = require('./fixtures/dummy-services');

describe('reporting', function () {

  var SECOND = 1000;
  var MINUTE = SECOND * 60; //ms
  var HOUR = MINUTE * 60; //ms
  var DAY = HOUR * 24; //ms

  var service;
  var storage = new redisStorage_class({port: 6666, host: '127.0.0.1', db: 0});
  var reporter;
  var INITIAL_TIME = 946684800000;

  function saveLatencyRecords(service, latencyData, callback) {
    function addLatency(val, cb) {
      storage.saveLatency(service, val.timestamp, val.latency, cb);
    }

    async.eachSeries(latencyData, addLatency, callback);
  }

  function addOutageRecords(service, outageData, outageDuration, outageInterval, callback) {
    function addOutage(outage, cb) {
      outage.timestamp = +new Date();
      storage.startOutage(service, outage, function (err) {
        assert.ifError(err);
        clock.tick(outageDuration);
        storage.archiveCurrentOutageIfExists(service, function (err) {
          clock.tick(outageInterval);
          cb();
        });
      });
    }

    async.eachSeries(outageData, addOutage, callback);
  }

  beforeEach(function (done) {

    clock = sinon.useFakeTimers(INITIAL_TIME);

    reporter = new reportService(storage);

    servicesFixtures = dummyServiceGenerator.generate(1);

    storage.flush_database(function () {

      populator.populate(servicesFixtures, storage, function (err) {
        assert.ifError(err);

        storage.getService(servicesFixtures[0].id, function (err, _service) {
          assert.ifError(err);
          service = _service;
          done();
        });
      });
    });
  });

  after(function (done) {
    clock.restore();
    done();
  });

  describe('service', function () {

    it('should deal with invalid service IDs', function (done) {
      reporter.getService('XXXinvalidXXX', function (err, data) {
        assert.ifError(err);
        assert.equal(data, null);
        done();
      });
    });

    describe('outages', function () {

      it('should get current outage information', function (done) {
        var outageData = {
          timestamp: +new Date(),
          error: 'my error'
        };

        storage.startOutage(service, outageData, function (err) {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.ok(data.status.currentOutage);
            done();
          });
        });
      });

      it('should return latest 10 outages', function (done) {
        var outageData = [];
        for (var i = 0; i < 12; i++) {
          outageData.push({error: 'my error'});
        }
        var outageDuration = 4 * MINUTE, outageInterval = HOUR;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.latestOutages.length, 10);
            done();
          });
        });
      });


      it('should return latest outages max one week old', function (done) {
        var outageData = [];
        for (var i = 0; i < 10; i++) {
          outageData.push({error: 'my error'});
        }
        var outageDuration = 4 * MINUTE, outageInterval = DAY;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.latestOutages.length, 6);
            done();
          });
        });
      });

      it('should return last week outages', function (done) {
        var outageData = [];
        for (var i = 0; i < 10; i++) {
          outageData.push({error: 'my error'});
        }
        var outageDuration = 1 * HOUR, outageInterval = DAY;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.lastWeek.outages.length, 6);
            assert.equal(data.status.lastWeek.numberOutages, 6);
            done();
          });
        });
      });

      it('should return last 24 hours outages', function (done) {
        var outageData = [];
        for (var i = 0; i < 40; i++) {
          outageData.push({error: 'my error'});
        }
        var outageDuration = 1 * MINUTE, outageInterval = HOUR;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.last24Hours.outages.length, 23);
            assert.equal(data.status.last24Hours.numberOutages, 23);
            done();
          });
        });
      });


      // TODO: need to optimise report service to only query the DB once.

      //it('should return last hour outages', function (done) {
      //  var outageData = [];
      //  for (var i = 0; i < 70; i++) {
      //    outageData.push({error: 'my error'});
      //  }
      //  var outageDuration = 1 * SECOND, outageInterval = MINUTE;
      //  addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
      //    reporter.getService(service.id, function (err, data) {
      //      assert.ifError(err);
      //      assert.equal(data.status.lastHour.outages.length, 59);
      //      assert.equal(data.status.lastHour.numberOutages, 59);
      //      done();
      //    });
      //  });
      //});

    });

    describe('latency', function () {

      it('should return latency from last week aggregated by day', function (done) {
        var data = [
          {timestamp: INITIAL_TIME, latency: 100},
          {timestamp: INITIAL_TIME + 1.1 * DAY, latency: 200},

          {timestamp: INITIAL_TIME + 2 * DAY, latency: 400},

          {timestamp: INITIAL_TIME + 3 * DAY, latency: 900},
          {timestamp: INITIAL_TIME + 3.5 * DAY, latency: 1100}
        ];

        saveLatencyRecords(service, data, function () {
          clock.tick(4 * HOUR);
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.lastWeek.latency.list.length, 4);
            assert.equal(data.status.lastWeek.latency.list[0].l, 1000);
            assert.equal(data.status.lastWeek.latency.list[1].l, 400);
            assert.equal(data.status.lastWeek.latency.list[2].l, 200);
            assert.equal(data.status.lastWeek.latency.list[3].l, 100);
            done();
          });
        });
      });

      it('should return latency from last 24 hours aggregated by the hour', function (done) {
        var data = [
          {timestamp: INITIAL_TIME, latency: 100},
          {timestamp: INITIAL_TIME + HOUR, latency: 200},
          {timestamp: INITIAL_TIME + 2 * HOUR, latency: 400},
          {timestamp: INITIAL_TIME + 3 * HOUR, latency: 900},
          {timestamp: INITIAL_TIME + 3.5 * HOUR, latency: 1100}
        ];

        saveLatencyRecords(service, data, function () {
          clock.tick(4 * HOUR);
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.last24Hours.latency.list.length, 4);
            assert.equal(data.status.last24Hours.latency.list[0].l, 1000);
            assert.equal(data.status.last24Hours.latency.list[1].l, 400);
            assert.equal(data.status.last24Hours.latency.list[2].l, 200);
            done();
          });
        });
      });

      it('should return latency from last hour aggregated by the minute', function (done) {
        var data = [
          // first minute
          {timestamp: INITIAL_TIME, latency: 100},

          // second minute
          {timestamp: INITIAL_TIME + MINUTE, latency: 200},
          {timestamp: INITIAL_TIME + 1.5 * MINUTE, latency: 300},

          // third minute
          {timestamp: INITIAL_TIME + 2 * MINUTE, latency: 400},
          {timestamp: INITIAL_TIME + 2.3 * MINUTE, latency: 500},
          {timestamp: INITIAL_TIME + 2.6 * MINUTE, latency: 600}
        ];

        saveLatencyRecords(service, data, function () {
          clock.tick(4 * MINUTE);
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.lastHour.latency.list.length, 3);
            assert.equal(data.status.lastHour.latency.list[0].l, 500);
            assert.equal(data.status.lastHour.latency.list[1].l, 250);
            assert.equal(data.status.lastHour.latency.list[2].l, 100);
            done();
          });
        });
      });

    });

    describe('uptime', function () {

      it('should return zero uptime if service started down', function (done) {
        storage.startOutage(service, {timestamp: +new Date(), error: 'my error'}, function (err) {
          clock.tick(1000);
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.lastHour.uptime, 0);
            assert.equal(data.status.last24Hours.uptime, 0);
            assert.equal(data.status.lastWeek.uptime, 0);
            done();
          });
        });
      });

      it('should calculate uptime for lastHour', function (done) {
        var outageData = [
          {error: 'my error'},
          {error: 'my error'},
          {error: 'my error'}
        ];
        var outageDuration = MINUTE * 3, outageInterval = MINUTE * 27;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.lastHour.uptime, 90); // 2 outages of 3 minutes each in 60 min total time
            done();
          });
        });
      });

      it('should calculate uptime for last24Hours', function (done) {
        var outageData = [
          {error: 'my error'},
          {error: 'my error'},
          {error: 'my error'},
          {error: 'my error'},
          {error: 'my error'}
        ];
        var outageDuration = HOUR, outageInterval = HOUR * 7;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.last24Hours.uptime, 87.5); // 3 outages of 1 hour each in 24 hour. (1 - 3/24)
            done();
          });
        });
      });

      it('should calculate uptime for lastWeek', function (done) {
        var outageData = [
          {error: 'my error'},
          {error: 'my error'},
          {error: 'my error'}
        ];
        var outageDuration = 1000, outageInterval = 1000;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.lastWeek.uptime, 50); // 3 outages of 1 second each in 6 seconds total time
            done();
          });
        });
      });

      it('should round uptimes to three decimal points', function (done) {
        var outageData = [
          {error: 'my error'},
          {error: 'my error'},
          {error: 'my error'}
        ];
        var outageDuration = 1000, outageInterval = 2000;
        addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
          reporter.getService(service.id, function (err, data) {
            assert.ifError(err);
            assert.equal(data.status.lastWeek.uptime, 66.667); // real value without rounding would be 66.66666666666
            done();
          });
        });
      });

    })
  });

  describe('services', function () {
    it('should return number of outages from the past week', function (done) {
      var outageData = [
        // last week
        {error: 'my error'},
        {error: 'my error'},
        {error: 'my error'},
        {error: 'my error'},
        {error: 'my error'},
        {error: 'my error'},

        // prev week
        {error: 'my error'},
        {error: 'my error'},
        {error: 'my error'}
      ];
      var outageDuration = 1000, outageInterval = DAY;
      addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
        reporter.getServices({}, function (err, servicesData) {
          assert.ifError(err);
          var _service = servicesData.filter(function (row) {
            return row.service.id == service.id
          })[0];
          assert.equal(_service.status.lastWeek.numberOutages, 6);
          done();
        });
      });
    });

    it('should return number of outages last 24 hours', function (done) {
      var outageData = [
        {error: 'my error'},
        {error: 'my error'},
        {error: 'my error'}
      ];
      var outageDuration = 1000, outageInterval = 1000;
      addOutageRecords(service, outageData, outageDuration, outageInterval, function () {
        reporter.getServices({}, function (err, servicesData) {
          assert.ifError(err);
          var _service = servicesData.filter(function (row) {
            return row.service.id == service.id
          })[0];
          assert.equal(_service.status.last24Hours.numberOutages, 3);
          done();
        });
      });
    });
  });
});
