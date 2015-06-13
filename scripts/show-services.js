var storageFactory = require('../lib/storage/storage-factory');
var program = require('commander');

function run(program, cb){
  var env = program.env || 'development';
  var storage = storageFactory.getStorageInstance(env);
  if (!storage){
    return cb('Invalid storage');
  }
  storage.getServices({}, function(err, services){
    services.forEach(function(s){
      console.log(s.id, s.name, s.url, s.interval);
    });
    storage.quit();
    cb();
  });
}

program
    .option('-e, --env [env]', 'Storage environment key')
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