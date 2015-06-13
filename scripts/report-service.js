var storageFactory = require('../lib/storage/storage-factory');
var reporterFactory = require('../lib/reporter');
var program = require('commander');

function printServiceReport(serviceReport){
  var service = serviceReport.service;
  console.log('\n');
  console.log(service.id, service.name, service.url, service.interval);
  console.log('Outage:', serviceReport.status.currentOutage);
  var latestLatency = serviceReport.status.last24Hours.latency.list;
  latestLatency.sort(function(a, b){
    return b.t - a.t;
  });
  if (latestLatency.length) {
    console.log('Latest latency record: ', new Date(latestLatency[0].t));
  }
  else {
    console.log('No latency records found');
  }
  console.log('Latest outages:', serviceReport.status.latestOutages);
  console.log('\n');
}

function run(program, cb){
  if (!program.serviceId) {
    return cb('service ID is required');
  }
  var env = program.env || 'development';
  var storage = storageFactory.getStorageInstance(env);
  if (!storage){
    return cb('Invalid storage');
  }

  var reporter = new reporterFactory(storage);
  reporter.getService(program.serviceId, function(err, service){
    if (!service) {
      return cb('service not found with id ' + program.serviceId);
    }
    printServiceReport(service);
    storage.quit();
    cb();
  });
}

program
    .option('-e, --env [env]', 'Storage environment key')
    .option('-s, --service-id <id>', 'Storage environment key')
    .parse(process.argv);

run(program, function (err) {
  if (err) {
    console.error(err);
  }
  else {
    console.log('done!');
  }
  process.exit(0);
});