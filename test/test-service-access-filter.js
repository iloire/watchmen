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

  it('should filter services', function () {
    var servicesFiltered = serviceFilter.filterReports(SERVICES_REPORTS, 'admin@domain.com');
    assert.equal(servicesFiltered.length, 1);
    assert.equal(servicesFiltered[0].service.name, 'service 1');
  });

  it('should filter a single service', function () {
    var servicesFiltered = serviceFilter.filterReports(SERVICES_REPORTS[1], 'admin@domain.com')
    assert.equal(servicesFiltered, undefined);
  });

  it('should handle null parameters', function () {
    var servicesFiltered = serviceFilter.filterReports(null, 'admin@domain.com')
    assert.equal(servicesFiltered, undefined);
  });

});