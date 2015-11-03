var serviceFilter = require('../lib/service-access-filter');
var assert = require('assert');

describe('service access filter', function () {
  var SERVICES = [
    {
      name: 'service 1',
      restrictedTo: 'admin@domain.com'
    },
    {
      name: 'service 2',
      restrictedTo: 'user@domain.com'
    }
  ];

  var SERVICES_REPORTS = [
    {
      service: SERVICES[0]
    },
    {
      service: SERVICES[1]
    }
  ];

  describe('isServiceRestrictedToEmail', function(){
    it('should return if email is restricted', function () {
      assert.ok(!serviceFilter._isServiceRestrictedToEmail(SERVICES[0], 'admin@domain.com'));
      assert.ok(serviceFilter._isServiceRestrictedToEmail(SERVICES[0], 'dmin@domain.com'));
      assert.ok(!serviceFilter._isServiceRestrictedToEmail({name : 'test'}, 'dmin@domain.com'));
      assert.ok(serviceFilter._isServiceRestrictedToEmail({
        name : 'test',
        restrictedTo: 'admin@domain.com'
      }, 'user@domain.com'));
    });

    it('should handle empty email', function () {
      assert.ok(serviceFilter._isServiceRestrictedToEmail(SERVICES[0], ''));
      assert.ok(serviceFilter._isServiceRestrictedToEmail(SERVICES[0], null));
      assert.ok(serviceFilter._isServiceRestrictedToEmail(SERVICES[0], undefined));
      assert.ok(!serviceFilter._isServiceRestrictedToEmail(null, undefined));
    });

    it('should handle empty email in restrictedTo', function () {
      assert.ok(serviceFilter._isServiceRestrictedToEmail({
        name: 'test',
        restrictedTo: ' ,email1@domain.com'
      }, ''));
    });

  });

  describe('filter Reports', function () {
    it('should filter services', function () {
      var resports = serviceFilter.filterReports(SERVICES_REPORTS, {email : 'admin@domain.com'});
      assert.equal(resports.length, 1);
      assert.equal(resports[0].service.name, 'service 1');
    });

    it('should match full address', function () {
      var reports = serviceFilter.filterReports(SERVICES_REPORTS, {email : 'min@domain.com'});
      assert.equal(reports.length, 0);
    });

    it('should filter a single service', function () {
      var reports = serviceFilter.filterReports(SERVICES_REPORTS[1], {email : 'admin@domain.com'});
      assert.equal(reports, undefined);
    });

    it('should handle null parameters', function () {
      var reports = serviceFilter.filterReports(null, {email : 'admin@domain.com'});
      assert.equal(reports, undefined);
    });
  });

  describe('filter services', function () {
    it('should filter services', function () {
      var services = serviceFilter.filterServices(SERVICES, {email : 'admin@domain.com'});
      assert.equal(services.length, 1);
      assert.equal(services[0].name, 'service 1');
    });

    it('should match full address', function () {
      var services = serviceFilter.filterServices(SERVICES, {email : 'min@domain.com'});
      assert.equal(services.length, 0);
    });

    it('should filter a single service', function () {
      var services = serviceFilter.filterServices(SERVICES[1], {email : 'admin@domain.com'});
      assert.equal(services, undefined);
    });

    it('should handle null parameters', function () {
      var services = serviceFilter.filterServices(null, {email : 'admin@domain.com'});
      assert.equal(services, undefined);
    });
  });

});