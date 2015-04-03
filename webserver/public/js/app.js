(function(){

    'use strict';

    /* App Module */

    var watchmenApp = angular.module('watchmenApp', [
        'ngRoute',
        'ngAnimate',
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
                    templateUrl: 'partials/service-detail.html',
                    controller: 'ServiceDetailCtrl'
                }).
                otherwise({
                    templateUrl: 'partials/service-list.html',
                    controller: 'ServiceListCtrl'
                });
        }]);
})();