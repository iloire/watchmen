(function () {

  'use strict';

  window.Charting = window.Charting || {};

  /**
   *
   * @param options.size
   * @param options.id
   * @param options.columns
   * @param options.x_format
   * @returns {*}
   */
  Charting.generateLatencyChart = function (options) {

    return c3.generate({
      size: options.size,
      bindto: options.id,
      legend: {
        position: 'right'
      },
      data: {
        x: 'x',
        columns: options.columns,
        types: {
          Latency: 'area-spline',
          Threshold: 'spline'
        },
        colors: {
          Latency: 'green',
          Threshold: 'orange'
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

  };


})();
