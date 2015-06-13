var storageFactory = require('../lib/storage/storage-factory');
var program = require('commander');

function run(program){
  var env = program.env || 'development';
  var storage = storageFactory.getStorageInstance(env);
  if (!storage){
    console.error('Invalid storage');
    return;
  }
  storage.getServices({}, function(err, services){
    services.forEach(function(s){
      console.log(s.id, s.name, s.url, s.interval);
    });
    storage.quit();
  });
}

program
    .option('-e, --env [env]', 'Storage environment key')
    .parse(process.argv);

run(program, function () {
  debug('done!');
  process.exit(0);
});