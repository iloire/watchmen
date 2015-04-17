(function(){

    'use strict';

    window.Utils = window.Utils || {};

    /**
     * Converts [{t: 1428220800000, l: 123.23}]
     *
     * into
     *
     * { labels : [1428220800000], data: [123] }
     *
     */
    Utils.parseArrayObjectsForCharting = function (arr) {
        var labels = [];
        var data = [];
        for (var i = 0; i < arr.length; i++) {
            labels.push([arr[i].t]);
            data.push(Math.round([arr[i].l]));
        }
        return { labels : labels, data: data };
    };

})();
