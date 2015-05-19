(function () {

  'use strict';

  window.Charting = window.Charting || {};

  var MINUTE = 60 * 1000;
  var HOUR = 60 * MINUTE;

  /**
   *
   * @param options.size
   * @param options.id
   * @param options.columns
   * @param options.x_format
   * @returns {*}
   */
  Charting.generateOutagesChart = function (options) {

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
              return value + ' ms.';
            }
          }
        }
      }
    });
  };

})();
