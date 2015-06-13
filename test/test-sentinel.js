var sentinelFactory = require('../lib/sentinel');
var assert = require('assert');

describe('sentinel', function () {

  it('should find new Services', function () {
    var dbServices = [{id: 'Eg34'}, {id: 2}, {id: '33'}];
    var runningServices = [{id: 'Eg34'}, {id: 2}];
    var sentinel = new sentinelFactory([], null);
    var addedServices = sentinel._findAdded(dbServices, runningServices);
    assert.equal(addedServices.length, 1);
  });

  it('should find removed Services', function () {
    var dbServices = [{id: 'Eg34'}, {id: 2}];
    var runningServices = [{id: 'Eg34'}, {id: 2}, {id: '98989'}, {id: '33'}];
    var sentinel = new sentinelFactory([], null);
    var removedServices = sentinel._findRemoved(dbServices, runningServices);
    assert.equal(removedServices.length, 2);
  });

  it('should find modified Services', function () {
    var dbServices = [{id: '1', interval: 2000}, {id: '2', interval: 3000}, {id: '3', interval: 4000}];
    var runningServices = [{id: '1', interval: 2300}, {id: '2', interval: 3000}, {id: '3', interval: 4000}];
    var sentinel = new sentinelFactory([], null);
    var modifiedServices = sentinel._findModified(dbServices, runningServices);
    assert.equal(modifiedServices.length, 1);
  });

  it('should filter ignored fields', function () {
    var dbServices = [{id: '1', pingService: 'val1'}, {id: '2', pingService: 'val1'}];
    var runningServices =  [{id: '1', pingService: 'val1'}, {id: '2', pingService: 'val2'}];
    var sentinel = new sentinelFactory([], null);
    var modifiedServices = sentinel._findModified(dbServices, runningServices);
    assert.equal(modifiedServices.length, 0);
  });
});