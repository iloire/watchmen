var storageFactory = require('../../lib/storage/storage-factory');
var storage = storageFactory.getStorageInstance('development'); //TODO

storage.flush_database(function(){
  storage.quit();
  console.log('done');
});