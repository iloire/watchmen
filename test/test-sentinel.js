var sentinelFactory = require('../lib/sentinel');
var assert = require('assert');

describe('sentinel', function () {

  it('it should find new Services', function () {
    var dbServices = [{id: 'Eg34'}, {id: 2}, {id: '33'}];
    var runningServices = [{id: 'Eg34'}, {id: 2}];
    var sentinel = new sentinelFactory([], null);
    var addedServices = sentinel._findAdded(dbServices, runningServices);
    assert.equal(addedServices.length, 1);
  });

  it('it should find removed Services', function () {
    var dbServices = [{id: 'Eg34'}, {id: 2}];
    var runningServices = [{id: 'Eg34'}, {id: 2}, {id: '98989'}, {id: '33'}];
    var sentinel = new sentinelFactory([], null);
    var addedServices = sentinel._findRemoved(dbServices, runningServices);
    assert.equal(addedServices.length, 2);
  });

});