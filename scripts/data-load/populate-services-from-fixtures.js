var storageFactory = require('../../lib/storage/storage-factory');
var populator = require('../../test/lib/util/populator');

var services;

function run(program){
  var env = program.env || 'development';
  var storage = storageFactory.getStorageInstance(env);

  if (!storage) {
    console.error('Not available storage for the provided environment ' + env);
    return;
  }

  if (program.real) {
    console.log('Pupulating real services...');
    services = require('../../test/fixtures/real-services');
  } else {
    console.log('Pupulating real services...');
    services = require('../../test/fixtures/dummy-services');
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
    .option('-e, --env [env]', 'Storage environment key')
    .parse(process.argv);

run(program);
