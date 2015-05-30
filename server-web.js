var storageFactory = require ('./lib/storage/storage-factory');
var storage = storageFactory.getStorageInstance(process.env.NODE_ENV || 'development');

var app = require('./webserver/app')(storage);

var port = parseInt(process.argv[2], 10) || 3000;
var server = app.listen(port, function () {
  if (server.address()) {
    console.log("watchmen server listening on port %d in %s mode", port, app.settings.env);
  } else {
    console.log('something went wrong... couldn\'t listen to that port.');
    process.exit(1);
  }

  process.on('SIGINT', function () {
    console.log('stopping web server.. bye!');
    server.close();
    process.exit(0);
  });
});
