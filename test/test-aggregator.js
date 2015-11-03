var aggregator = require('../lib/aggregator');
var assert = require('assert');

describe('aggregator', function () {

  var SECOND = 1000;
  var MINUTE = 60 * SECOND;
  var HOUR = 60 * MINUTE;

  var initialTime = +new Date(2015, 1, 1); // start with 0 hours, 0 minutes, 0 seconds

  it('should aggregate by minute', function (done) {
    var arr = [
      {t: initialTime, l: 200},
      {t: initialTime + 20 * SECOND, l: 100},

      {t: initialTime + MINUTE + 20 * SECOND, l: 400},
      {t: initialTime + MINUTE + 40 * SECOND, l: 500}
    ];
    aggregator.aggregate(arr, 'minute', function (data) {
      assert.equal(data.length, 2);
      assert.equal(data[0].l, 150);
      assert.equal(data[1].l, 450);
      done();
    });
  });

  it('should aggregate by hour', function (done) {
    var arr = [
      {t: initialTime, l: 200},
      {t: initialTime + 20 * MINUTE, l: 100},

      {t: initialTime + HOUR + 20 * MINUTE, l: 700},
      {t: initialTime + HOUR + 20 * MINUTE, l: 800}
    ];
    aggregator.aggregate(arr, 'hour', function (data) {
      assert.equal(data.length, 2);
      assert.equal(data[0].l, 150);
      assert.equal(data[1].l, 750);
      done();
    });

  });

});