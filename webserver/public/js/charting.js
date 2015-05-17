(function(){

    'use strict';

    window.Charting = window.Charting || {};


    /**
     * Renders a C3 chart
     * @param data
     */
    Charting.render = function (options) {

        // latencyData = { labels : [1428220800000], data: [123] }
        var latencyData = parseArrayObjectsForCharting(options.latency);

        var timeSerie = latencyData.labels;
        var outages = [];
        for (var j = 0; j < timeSerie.length; j++) {
            var downtime = 0;
            var time = timeSerie[j];
            for (var i = 0; i < options.outages.length; i++) {
                var outage = options.outages[i];
                if (time >= outage.timestamp && (time < outage.timestamp + outage.downtime)) {
                    downtime += outage.downtime;
                }
            }
            outages.push(downtime);
        }

        timeSerie.splice(0, 0, 'x');
        latencyData.data.splice(0, 0, 'Latency');

        var threshold = latencyData.data.slice();
        threshold[0] = 'Threshold';
        outages.splice(0, 0, 'Outages');
        threshold = threshold.map(function(item){
            if (isNaN(item)){
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
                    latencyData.data,
                    outages,
                    threshold
                ],
                types: {
                    Latency: 'area-spline',
                    Outages: 'bar',
                    Threshold: 'spline'
                },
                colors: {
                    Latency: 'green',
                    Outages: 'red',
                    Threshold: 'orange'
                },
                groups: [['Latency','Outages']]
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
