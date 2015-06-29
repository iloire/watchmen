var colors = require('colors');
var program = require('commander');
var pluginLoader = require('./lib/plugin-loader');
var storageFactory = require('./lib/storage/storage-factory');
var WatchMenFactory = require('./lib/watchmen');
var sentinelFactory = require('./lib/sentinel');

var RETURN_CODES = {
  OK: 0,
  BAD_STORAGE: 1,
  GENERIC_ERROR: 2
};

program
    .option('-e, --env [env]', 'Storage environment key', process.env.NODE_ENV || 'development')
      .option('-d, --max-initial-delay [value]', 'Initial random delay max bound', 20000)
    .parse(process.argv);

var storage = storageFactory.getStorageInstance(program.env);
if (!storage) {
  console.error('Error creating storage for env: ', program.env);
  return process.exit(RETURN_CODES.BAD_STORAGE);
}

storage.getServices({}, function (err, services) {
  if (err) {
    console.error('error loading services'.red);
    console.error(err);
    return exit(RETURN_CODES.GENERIC_ERROR);
  }

  var watchmen = new WatchMenFactory(services, storage);

  pluginLoader.loadPlugins(watchmen, {}, function(){
    watchmen.startAll({randomDelayOnInit: program.maxInitialDelay});
    console.log('\nwatchmen has started. ' + services.length + ' services loaded\n');

    var sentinel = new sentinelFactory(storage, watchmen, {interval: 10000});
    sentinel.watch();
  });

});

process.on('SIGINT', function () {
  console.log('stopping watchmen..'.gray);
  exit(RETURN_CODES.OK);
});

function exit(code) {
  storage.quit();
  process.exit(code);
}
