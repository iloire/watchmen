var storageConfiguration = require ('../../config/storage');

module.exports = {

  getStorageInstance : function (env){

    var config = storageConfiguration[env];
    if (!config) {
      console.error('No environment found for ', env);
      return null;
    }

    console.log('Using storage env: ', env);

    var provider = storageConfiguration[env].provider;
    var providerOptions = require ('../../config/storage')[env].options[provider];
    var storage = require ('./providers/' + provider);

    return new storage(providerOptions);
  }
};