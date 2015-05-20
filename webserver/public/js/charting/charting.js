(function () {

  'use strict';

  window.Charting = window.Charting || {};

  var MINUTE = 60 * 1000;
  var HOUR = 60 * MINUTE;

  Charting.renderOutages = function (options) {

    var outagesData = parseArrayObjectsForCharting(options.outages, 'timestamp', 'downtime');
    var outagesSerie = outagesData.data.map(function(y) { return y / 1000 }); // seconds
    
    var timeSerie = outagesData.time;

    timeSerie.splice(0, 0, +new Date() - 24 * HOUR);
    timeSerie.push(+new Date());

    outagesSerie.splice(0, 0, 0);
    outagesSerie.push(0);

    // create labels
    timeSerie.splice(0, 0, 'x');
    outagesSerie.splice(0, 0, 'Outages');

    return Charting.generateOutagesChart({
      size: options.size,
      id: options.id,
      x_format: options.x_format,
      columns: [timeSerie, outagesSerie],
      max: options.max
    });
  };

  /**
   * Renders a C3 chart
   * @param data
   */
  Charting.renderLatency = function (options) {

    var latencyData = parseArrayObjectsForCharting(options.latency, 't', 'l');

    var latencySerie = latencyData.data;
    var timeSerie = latencyData.time;

    timeSerie.splice(0, 0, 'x');
    latencySerie.splice(0, 0, 'Latency');

    var threshold = latencySerie.slice();
    threshold[0] = 'Threshold';
    threshold = threshold.map(function (item) {
      if (isNaN(item)) {
        return item;
      }
      else {
        return options.threshold;
      }
    });

    return Charting.generateLatencyChart({
      size: options.size,
      id: options.id,
      x_format: options.x_format,
      columns: [timeSerie, latencySerie, threshold],
      max: options.max
    });
  };

  /**
   * Converts [{t: 1428220800000, l: 123.23}]
   *
   * into
   *
   * { time : [1428220800000], data: [123] }
   *
   */
  function parseArrayObjectsForCharting(arr, fieldTime, fieldData) {
    var time = [];
    var latency = [];
    for (var i = 0; i < arr.length; i++) {
      time.push([arr[i][fieldTime]]);
      latency.push(Math.round([arr[i][fieldData]]));
    }
    return {time: time, data: latency};
  }

})();
