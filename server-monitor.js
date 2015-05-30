var colors = require('colors');
var pluginLoader = require('./lib/plugin-loader');
var storageFactory = require('./lib/storage/storage-factory');
var WatchMenFactory = require('./lib/watchmen');
var sentinelFactory = require('./lib/sentinel');

var PLUGINS_LOCATION = "plugins/monitor";

var storage = storageFactory.getStorageInstance(process.env.NODE_ENV || 'development');

storage.getServices({}, function (err, services) {
  if (err) {
    console.error('error loading services'.red);
    console.error(err);
    return exit(1);
  }

  var watchmen = new WatchMenFactory(services, storage);

  pluginLoader.loadPlugins(watchmen, {location: PLUGINS_LOCATION}, function () {
    watchmen.startAll();
    console.log('\nwatchmen has started. ' + services.length + ' services loaded\n');

    var sentinel = new sentinelFactory(storage, watchmen, {interval: 10000});
    sentinel.watch();
  });

});

process.on('SIGINT', function () {
  console.log('stopping watchmen..'.gray);
  exit(0);
});

function exit(code) {
  storage.quit();
  process.exit(code);
}
