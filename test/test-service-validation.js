var assert = require('assert');
var serviceValidator = require('../lib/service-validator');

var service;

describe('service validator', function () {

  beforeEach(function () {
    service = {
      name: 'my service',
      interval: 60 * 1000,
      failureInterval: 20 * 1000,
      url: 'http://apple.com',
      port: 443,
      timeout: 10000,
      warningThreshold: 3000,
      pingServiceName: 'http',
      restrictedTo: 'user@domain.com, admin@domain.com'
    }
  });

  it('should have an "name" field', function () {
    checkNonEmpty('name');
  });

  it('should have an "interval" field', function () {
    checkNonEmpty('interval');
  });

  it('should have a minimum interval of 500ms', function () {
    service.interval = 400;
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'interval');
  });

  it('should have an "failureInterval" field', function () {
    checkNonEmpty('failureInterval');
  });

  it('should have a minimum failureInterval of 500ms', function () {
    service.failureInterval = 400;
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, 'failureInterval');
  });

  it('should have an "url" field', function () {
    checkNonEmpty('url');
  });

  it('should have an "port" field', function () {
    checkNonEmpty('port');
  });

  it('should have a numeric value for "port"', function () {
    checkIntField('3434invalidnumber', 'port');
  });

  it('should have a numeric value for "failuresToBeOutage"', function () {
    checkIntField('3434invalidnumber', 'failuresToBeOutage');
  });

  it('should not allow a negative value for "failuresToBeOutage"', function () {
    checkIntField(-2, 'failuresToBeOutage');
  });

  it('should have a "timeout" field', function () {
    checkNonEmpty('timeout');
  });

  it('should have a numeric value for "timeout"', function () {
    checkIntField('3434invalidnumber', 'timeout');
  });

  it('should have a "warningThreshold" field', function () {
    checkNonEmpty('warningThreshold');
  });

  it('should have a numeric value for "warningThreshold"', function () {
    checkIntField('3434invalidnumber', 'warningThreshold');
  });

  it('should have a "pingServiceName" field', function () {
    checkNonEmpty('pingServiceName');
  });

  it('should have valid emails in "restrictedTo" field', function(){
    service.restrictedTo = 'invalidemail, user@domain.com';
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, errors);
    assert.equal(errors[0].field, 'restrictedTo');
  });

  it('should have valid not empty values in "restrictedTo" field', function(){
    service.restrictedTo = 'admin@domain.com, , user@domain.com';
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, errors);
    assert.equal(errors[0].field, 'restrictedTo');
  });

  it('should validate "restrictedTo" field if correct', function(){
    service.restrictedTo = 'admin@domain.com, user@domain.com';
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 0, errors);
  });

  it('should have valid emails in "alertTo" field', function(){
    service.alertTo = 'invalidemail, user@domain.com';
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, errors);
    assert.equal(errors[0].field, 'alertTo');
  });

  it('should have valid not empty values in "alertTo" field', function(){
    service.alertTo = 'admin@domain.com, , user@domain.com';
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, errors);
    assert.equal(errors[0].field, 'alertTo');
  });

  it('should validate "alertTo" field if correct', function(){
    service.alertTo = 'admin@domain.com, user@domain.com';
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 0, errors);
  });

  function checkNonEmpty(field) {
    delete service[field];
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1, errors);
    assert.equal(errors[0].field, field);
  }

  function checkIntField(val, field) {
    service[field] = val;
    var errors = serviceValidator.validate(service);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].field, field);
  }
});
