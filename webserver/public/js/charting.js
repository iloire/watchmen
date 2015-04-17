(function(){

    'use strict';

    window.Charting = window.Charting || {};

    /**
     * Renders a C3 chart with latency data
     * @param data
     */
    Charting.renderLatencyChart = function (options) {

        var data = Utils.parseArrayObjectsForCharting(options.data);

        data.data.splice(0, 0, 'Latency');
        data.labels.splice(0, 0, 'x');
        return c3.generate({
            size: options.size,
            bindto: options.id,
            data: {
                x: 'x',
                columns: [
                    data.labels,
                    data.data
                ],
                types: {
                    Latency: 'line'
                },
                colors: {
                    Latency: 'green'
                }
            },
            axis: {
                y: { max: options.max || 0 },
                x: {
                    type: 'timeseries',
                    tick: {
                        format: options.x_format || '%H:%M'
                    }
                }
            },
            tooltip: {
                format: {
                    title: function (d) { return 'Latency for ' + moment(d).format('DD/MMM HH:mm'); },
                    value: function (value, ratio, id) {
                        return value + ' ms.';
                    }
                }
            }
        });
    };

})();
