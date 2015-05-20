var colors = require('colors');
var pluginLoader = require('./lib/plugin-loader');
var storageFactory = require('./lib/storage/storage-factory');
var WatchMenFactory = require('./lib/watchmen');

var PLUGINS_LOCATION = "plugins/monitor";

var storage = storageFactory.getStorageInstance('development'); // TODO: correct flag according to env
storage.getServices({}, function (err, services) {
  if (err) {
    console.error('error loading services'.red);
    console.error(err);
    return exit(1);
  }

  // inject ping services
  services = services.map(function (service) {
    var pingFactory = require('watchmen-ping-' + service.pingServiceName);
    service.pingService = new pingFactory();
  });

  var watchmen = new WatchMenFactory(services, storage);

  pluginLoader.loadPlugins(watchmen, {location: PLUGINS_LOCATION}, function () {
    watchmen.start();
    console.log('\nwatchmen has started. ' + services.length + ' services loaded\n');
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
