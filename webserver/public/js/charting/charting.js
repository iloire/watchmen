(function () {

  'use strict';

  window.Charting = window.Charting || {};

  var MINUTE = 60 * 1000;

  /**
   * Renders a C3 chart
   * @param data
   */
  Charting.render = function (options) {

    var latencyData = parseArrayObjectsForCharting(options.latency, 't', 'l');

    var latencySerie = latencyData.data;
    var timeSerie = latencyData.time;

    timeSerie.splice(0, 0, 'x');
    latencySerie.splice(0, 0, 'Latency');

    var outagesRegions = [];
    if (options.outages) {
      for (var i = 0; i < options.outages.length; i++) {
        var outage = options.outages[i];
        outagesRegions.push({
          axis: 'x',
          start: outage.timestamp,
          end: outage.timestamp + outage.downtime,
          class: 'region-outage',
          opacity: 1
        });
      }
    }

    var regions = [
      {axis: 'y', start: options.threshold, class: 'region-latency-warning'},
    ].concat(outagesRegions);

    return generateLatencyChart({
      size: options.size,
      id: options.id,
      x_format: options.x_format,
      columns: [timeSerie, latencySerie],
      grid: {
        y: {
          lines: [
            {value: options.threshold, text: 'latency threshold', class: 'threshold'}
          ]
        }
      },
      regions: regions,
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

  function generateLatencyChart (options) {

    return c3.generate({
      size: options.size,
      bindto: options.id,
      legend: {
        show: false
      },
      data: {
        x: 'x',
        columns: options.columns,
        types: {
          Latency: 'area-spline'
        },
        colors: {
          Latency: 'green'
        }
      },
      axis: {
        y: {
          max: isNaN(options.max) ? 0 : options.max,
          tick: {
            values: [200, 500, 1000, 2000, 3000, 4000, 5000, 7000, 10000, 15000, 20000, 30000]
          }
        },
        x: {
          type: 'timeseries',
          tick: {
            format: options.x_format || '%H:%M'
          }
        }
      },
      grid: options.grid,
      regions: options.regions,
      tooltip: {
        format: {
          title: function (d) {
            return moment(d).format('DD/MMM/YY HH:mm') + ' (' + moment(d).fromNow() + ')';
          },
          value: function (value, ratio, id) {
            if (id == 'Outages') {
              return moment.duration(value).humanize();
            }
            else {
              return value + ' ms.';
            }
          }
        }
      }
    });

  }

})();
