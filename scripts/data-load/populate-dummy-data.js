var async = require('async');
var sinon = require('sinon');
var debug = require('debug')('data-load');
var watchmenFactory = require('../../lib/watchmen.js');
var mockedPingService = require('../../test/lib/mock/request-mocked');
var storageFactory = require('../../lib/storage/storage-factory');
var populator = require('../../test/lib/util/populator');
var responseRandomizer = require('./lib/response-randomizer');
var dummyServiceGenerator = require('../../test/fixtures/dummy-services');

var DEFAULT_PING_INTERVAL = 1000 * 60 * 1; // ms
var DEFAULT_NUMBER_DAYS_BACK = 7;

var watchmen;

function run(programOptions, callback) {

  var pingInterval = programOptions.pingInterval ||  DEFAULT_PING_INTERVAL;
  var numberDaysBack = programOptions.numberDaysBack ||  DEFAULT_NUMBER_DAYS_BACK;
  var numberPingsBack = numberDaysBack * 1000 * 60 * 60 * 24 / pingInterval;
  var initialTime = +new Date() - pingInterval * numberPingsBack;
  var services = dummyServiceGenerator.generate(programOptions.numberServices || 20);

  debug('ping interval:' + pingInterval);
  debug('number days back:' + numberDaysBack);

  function generateDataForService(service, callback) {
    var totalPings = 0;

    clock = sinon.useFakeTimers(initialTime);

    service.pingService = mockedPingService;

    function ping(cb) {
      var res = responseRandomizer.getRandomResponse(service, programOptions.targetUptime);
      mockedPingService.mockedResponse = res;
      watchmen.ping({service: service}, function (err) {
        totalPings++;
        clock.tick(DEFAULT_PING_INTERVAL - res.latency);
        cb(err);
      });
      clock.tick(res.latency);
    }

    async.whilst(
        function () { return totalPings < numberPingsBack; },
        ping,
        function (err) {
          callback(err);
        }
    );
  }

  function populatedata(services, cb) {
    debug('populating data for ' + services.length + ' services');
    async.eachSeries(services, generateDataForService, function (err) {
      debug('data populated for all services');
      cb(err);
    });
  }

  var env = programOptions.env || 'development';
  var storage = storageFactory.getStorageInstance(env);
  if (!storage) {
    console.error('Not available storage for the provided environment ' + env);
    return;
  }

  watchmen = new watchmenFactory(null, storage);

  storage.flush_database(function () {

    debug('database flushed');

    clock = sinon.useFakeTimers(initialTime);

    populator.populate(services, storage, function (err) {
      if (err) {
        return callback(err);
      }

      debug('services populated');

      storage.getServices({}, function (err, services) {
        if (err) {
          return callback(err);
        }

        if (programOptions.filter) {
          services = services.filter(function (s) {
            return s.name.indexOf(programOptions.filter) > -1;
          });
        }

        services.sort(function (a, b) {
          return a.name > b.name;
        });

        debug('program started');

        populatedata(services, function(err){
          storage.quit();
          callback(err);
        });

      });
    });
  });
}

var program = require('commander');
program
    .option('-f, --filter [filter]', 'Filter services to add dummy data to (by name)')
    .option('-e, --env [env]', 'Storage environment key')
    .option('-u, --target-uptime [targetUptime]', 'targetUptime')
    .option('-p, --ping-interval [pingInterval]', 'Ping interval')
    .option('-d, --number-days-back [numberDaysBack]', 'Number of days back when populating database')
    .option('-s, --number-services [numberServices]', 'Number of services')

    .parse(process.argv);

run(program, function () {
  debug('done!');
  process.exit(0);
});