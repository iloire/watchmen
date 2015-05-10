var assert = require ('assert');
var serviceValidator = require ('../lib/service-validator');

var service;

describe('service validator', function() {

  beforeEach(function(){
    service = {
      name: 'my service',
      interval: 60 * 1000,
      failureInterval: 20 * 1000,
      url: 'http://apple.com',
      port: 443,
      timeout: 10000,
      warningThreshold: 3000,
      pingServiceName: 'http',
      pingServiceOptions: {
        option1: 'value1'
      }
    }
  });

  it('should have an "name" field', function(){
    checkNonEmpty('name');
  });

  it('should have an "interval" field', function(){
    checkNonEmpty('interval');
  });

  it('should have a minimum interval of 500ms', function(){
    service.interval = 400;
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'interval');
  });

  it('should have an "failureInterval" field', function(){
    checkNonEmpty('failureInterval');
  });

  it('should have a minimum failureInterval of 500ms', function(){
    service.failureInterval = 400;
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'failureInterval');
  });

  it('should have an "url" field', function(){
    checkNonEmpty('url');
  });

  it('should have an "port" field', function(){
    checkNonEmpty('port');
  });

  it('should have a numberic value for "port"', function(){
    checkIntField('3434invalidnumber', 'port');
  });

  it('should have a "timeout" field', function(){
    checkNonEmpty('timeout');
  });

  it('should have a numberic value for "timeout"', function(){
    checkIntField('3434invalidnumber', 'timeout');
  });

  it('should have a "warningThreshold" field', function(){
    checkNonEmpty('warningThreshold');
  });

  it('should have a numberic value for "warningThreshold"', function(){
    checkIntField('3434invalidnumber', 'warningThreshold');
  });

  it('should have a "pingServiceName" field', function(){
    checkNonEmpty('pingServiceName');
  });

  it('should have a "pingServiceOptions" field', function(){
    checkNonEmpty('pingServiceName');
  });

  it('should have an object type on "pingServiceOptions" field', function(){
    service.pingServiceOptions = 'I am a string';
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, JSON.stringify(errors));
    assert.equal(errors[0].field, 'pingServiceOptions');
  });

  function checkNonEmpty(field){
    delete service[field];
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, JSON.stringify(errors));
    assert.equal(errors[0].field, field);
  }

  function checkIntField(val, field){
    service[field] = val;
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, field);
  }
});
