var validator = require('validator');

exports = module.exports = (function(){

  function validateInt(service, errors, field, options) {
    if (!validator.isInt(service[field], options || {})) {
      errors.push({ field: field, error: 'Invalid value for "'+ field + '"'});
    }
  }

  function validateExistence (service, errors, field) {
    if (!service[field]) {
      errors.push({ field: field, error: 'A value is required for field "' + field + '"'});
    }
  }

  function validateObject(service, errors, field) {
    if (service[field] === null || typeof service[field] !== 'object') {
      errors.push({ field: field, error: 'Invalid object for ' + field});
    }
  }

  return {

    /**
     * Validates service. Returns an array of errors if not valid or null if valid
     * @param service
     * @param cb
     */
    validate: function(service) {
      var errors = [];

      if (service === null || typeof service !== 'object') {
        errors.push({ field: '', error: 'Invalid service object'});
        return errors;
      }

      validateInt(service, errors, 'failureInterval', { min: 500 });
      validateInt(service, errors, 'interval', { min: 500 });
      validateInt(service, errors, 'warningThreshold');
      validateInt(service, errors, 'port');
      validateInt(service, errors, 'timeout');
      validateExistence(service, errors, 'pingServiceName');
      validateExistence(service, errors, 'pingServiceOptions');
      validateObject(service, errors, 'pingServiceOptions');
      validateExistence(service, errors, 'name');
      validateExistence(service, errors, 'url');

      return errors;
    }

  }

})();