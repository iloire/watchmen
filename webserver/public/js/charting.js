(function(){

    'use strict';

    window.Charting = window.Charting || {};

    /**
     * Renders a C3 chart
     * @param data
     */
    Charting.render = function (options) {

        //console.log(options)
        var latencyData = parseArrayObjectsForCharting(options.latency);
        var outages = [];
        for (var j = 0; j < latencyData.labels.length; j++) {
            var down = false;
            var time = latencyData.labels[j];
            for (var i = 0; i < options.outages.length; i++) {
                var outage = options.outages[i];
                if (time > outage.timestamp && time < outage.timestamp + outage.downtime) {
                    down = true;
                }
            }
            outages.push(down ? 1000 : 0);
        }

        latencyData.labels.splice(0, 0, 'x');
        latencyData.data.splice(0, 0, 'Latency');
        outages.splice(0, 0, 'Outages');

        return c3.generate({
            size: options.size,
            bindto: options.id,
            legend: {
                show: false
            },
            data: {
                x: 'x',
                columns: [
                    latencyData.labels,
                    latencyData.data,
                    outages
                ],
                types: {
                    Latency: 'area-spline',
                    Outages: 'bar'
                },
                colors: {
                    Latency: 'green',
                    Outages: 'red'
                }
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
                    title: function (d) { return moment(d).format('DD/MMM/YY HH:mm'); },
                    value: function (value, ratio, id) {
                        return value + ' ms.';
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
     * { labels : [1428220800000], data: [123] }
     *
     */
    function parseArrayObjectsForCharting  (arr) {
        var labels = [];
        var data = [];
        for (var i = 0; i < arr.length; i++) {
            labels.push([arr[i].t]);
            data.push(Math.round([arr[i].l]));
        }
        return { labels : labels, data: data };
    }

})();
