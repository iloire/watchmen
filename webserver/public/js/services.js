(function() {

    'use strict';

    /* Services */

    var watchmenServices = angular.module('watchmenServices', ['ngResource']);

    watchmenServices.factory('Service', ['$resource',
        function($resource){
            return $resource('services?host=:host&service=:service', {}, {
                query: {
                    method:'GET',
                    isArray:true
                }
            });
        }]);
})();