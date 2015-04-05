(function(){

    'use strict';

    /* App Module */

    var watchmenApp = angular.module('watchmenApp', [
        'ngRoute',
        'angularSpinner',
        'ngTable', // table sorting and pagination
        'angularMoment',
        'watchmenControllers',
        'watchmenServices'
    ]);

    watchmenApp.config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
                when('/details/:host/:service', {
                    templateUrl: 'service-detail.html',
                    controller: 'ServiceDetailCtrl'
                }).
                otherwise({
                    templateUrl: 'service-list.html',
                    controller: 'ServiceListCtrl'
                });
        }]);
})();