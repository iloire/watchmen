(function () {

  'use strict';

  window.Charting = window.Charting || {};

  var MINUTE = 60 * 1000;
  var HOUR = 60 * MINUTE;

  Charting.renderOutages = function (options) {

    var outagesData = parseArrayObjectsForCharting(options.outages, 'timestamp', 'downtime');
    var outagesSerie = outagesData.data;
    var timeSerie = outagesData.time;
    
    timeSerie.splice(0, 0, +new Date() - 24 * HOUR);
    timeSerie.push(+new Date());

    outagesSerie.splice(0, 0, 0);
    outagesSerie.push(0);

    // create labels
    timeSerie.splice(0, 0, 'x');
    outagesSerie.splice(0, 0, 'Outages');
    
    return c3.generate({
      size: options.size,
      bindto: options.id,
      legend: {
        show: false
      },
      data: {
        x: 'x',
        columns: [
          timeSerie,
          outagesSerie
        ],
        types: {
          Outages: 'bar'
        },
        colors: {
          Outages: 'red'
        }
      },
      axis: {
        y: {

        },
        x: {
          min: +new Date() - 24 * HOUR,
          max: +new Date(),
          type: 'timeseries',
          tick: {
            format: options.x_format || '%H:%M'
          }
        }
      },
      tooltip: {
        format: {
          title: function (d) {
            return moment(d).format('DD/MMM/YY HH:mm');
          },
          value: function (value, ratio, id) {
            if (id == 'Outages') {
              return moment.duration(value).humanize();
            }
            else {
              return value + ' ms.'
            }
          }
        }
      }
    });
  };

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

    return c3.generate({
      size: options.size,
      bindto: options.id,
      legend: {
        show: false
      },
      data: {
        x: 'x',
        columns: [
          timeSerie,
          latencySerie,
          threshold
        ],
        types: {
          Latency: 'area-spline',
          Threshold: 'spline'
        },
        colors: {
          Latency: 'green',
          Threshold: 'orange'
        },
        groups: [['Latency', 'Outages']]
      },
      axis: {
        y: {
          max: options.max || 0,
          tick: {
            values: [1000, 2000, 3000, 4000, 5000, 7000, 10000, 15000, 20000, 30000]
          }
        },
        x: {
          type: 'timeseries',
          tick: {
            format: options.x_format || '%H:%M'
          }
        }
      },
      tooltip: {
        format: {
          title: function (d) {
            return moment(d).format('DD/MMM/YY HH:mm');
          },
          value: function (value, ratio, id) {
            if (id == 'Outages') {
              return moment.duration(value).humanize();
            }
            else {
              return value + ' ms.'
            }
          }
        }
      }
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
