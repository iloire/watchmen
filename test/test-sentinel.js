var sentinelFactory = require('../lib/sentinel');
var assert = require('assert');

describe('sentinel', function () {

  it('should find new services', function () {
    var dbServices = [{id: 'Eg34'}, {id: 2}, {id: '33'}];
    var runningServices = [{id: 'Eg34'}, {id: 2}];
    var sentinel = new sentinelFactory([], null);
    var addedServices = sentinel._findAdded(dbServices, runningServices);
    assert.equal(addedServices.length, 1);
  });

  it('should find removed services', function () {
    var dbServices = [{id: 'Eg34'}, {id: 2}];
    var runningServices = [{id: 'Eg34'}, {id: 2}, {id: '98989'}, {id: '33'}];
    var sentinel = new sentinelFactory([], null);
    var removedServices = sentinel._findRemoved(dbServices, runningServices);
    assert.equal(removedServices.length, 2);
  });

  it('should find modified services when white-listed fields change', function () {
    var dbServices = [{id: '1', interval: 2000}, {id: '2', interval: 3000}];
    var runningServices = [{id: '1', interval: 2300}, {id: '2', interval: 3000}];
    var sentinel = new sentinelFactory([], null);
    var modifiedServices = sentinel._findModified(dbServices, runningServices);
    assert.equal(modifiedServices.length, 1);
  });

  it('should ignore certain fields', function () {
    var dbServices = [{id: '1', ignoreField: 'ignored field'}, {id: '2', ignoreField: 'ignored field'}];
    var runningServices = [{id: '1', ignoreField: 'change in ignored field'}, {id: '2', ignoreField: 'other change in ignored field'}];
    var sentinel = new sentinelFactory([], null);
    var modifiedServices = sentinel._findModified(dbServices, runningServices);
    assert.equal(modifiedServices.length, 0);
  });

  it('should handle json properties', function () {
    var dbServices = [{id: '1', pingServiceOptions: {'http-contains': [{name: 'my property'}]}}];
    var runningServices = [{id: '1', pingServiceOptions: {'http-contains': [{name: 'my property'}]}}];
    var sentinel = new sentinelFactory([], null);
    var modifiedServices = sentinel._findModified(dbServices, runningServices);
    assert.equal(modifiedServices.length, 0);
  });

});