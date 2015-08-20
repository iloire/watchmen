var storageFactory = require('../../lib/storage/storage-factory');
var populator = require('../../test/lib/util/populator');
var dummyServiceGenerator = require('../../test/fixtures/dummy-services');
var services;

function run(program){
  var env = program.env || 'development';
  var storage = storageFactory.getStorageInstance(env);

  if (!storage) {
    console.error('Not available storage for the provided environment ' + env);
    return;
  }

  if (program.file) {
    console.log('Populating from ' + program.file);
    services = require(program.file);
  } else if (program.real) {
    console.log('Populating real services...');
    services = require('../../test/fixtures/real-services');
  } else {
    console.log('Populating real services...');
    services = dummyServiceGenerator.generate(program.numberServices || 20);
  }

  populator.populate(services, storage, function(err){
    if (err) {
      console.error(err);
    } else {
      console.log('done! ' + services.length + ' services populated');
    }
    storage.quit();
  });
}


var program = require('commander');
program
    .option('-r, --real', 'User real data')
    .option('-f, --file [file]', 'Fixture file')
    .option('-e, --env [env]', 'Storage environment key')
    .option('-s, --number-services [numberServices]', 'Number of services')
    .parse(process.argv);

run(program);
