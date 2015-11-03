var async = require('async');
var serviceValidator = require('../../../lib/service-validator');

exports = module.exports = (function(){

  return {

    /**
     * Utility to populate a list of services using the provided storage
     * @param services
     * @param storage
     * @param callback
     */

    populate: function(services, storage, callback){

      if (!services || !services.length) {
        return callback('services not provided');
      }

      function addService(service, cb) {
        var errors = serviceValidator.validate(service);
        if (errors.length === 0){
          storage.addService(service, cb);
        } else {
          cb(errors);
        }
      }

      storage.flush_database(function() {
        async.eachSeries(services, addService, function (err) {
          if (err) {
            return callback(err);
          }
          callback();
        });
      });
    }
  };

})();