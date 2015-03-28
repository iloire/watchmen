'use strict';

/* Controllers */

var SERVICES_POLLING_INTERVAL = 3000;

var watchmenControllers = angular.module('watchmenControllers', []);

watchmenControllers.controller('ServiceListCtrl', ['$scope', '$filter', '$timeout', 'Service', 'ngTableParams',
    function($scope, $filter, $timeout, Service, ngTableParams) {

        var key = 'tableServicesData';

        $scope[key] = [];
        $scope.tableParams = createngTableParams(key, ngTableParams, $scope, $filter, 5);


        (function tick($scope, Service) {

            function scheduleNextTick (){
                $timeout(function(){
                    tick($scope, Service)
                }, SERVICES_POLLING_INTERVAL);
            };

            function errorHandler(err){
                $scope.errorLoadingServices="Error loading data from remote server";
                console.error(err);
                scheduleNextTick();
            }

            $scope.services = Service.query(function(data){
                $scope.errorLoadingServices=null;

                $scope[key] = data;
                $scope.tableParams.reload();

                scheduleNextTick();
            }, errorHandler);

        })($scope, Service);
    }]);

watchmenControllers.controller('ServiceDetailCtrl', ['$scope', '$filter', '$routeParams', 'Service', 'ngTableParams',
    function($scope, $filter, $routeParams, Service, ngTableParams) {
        $scope.serviceDetails = Service.get({ serviceId: $routeParams.host + ',' + $routeParams.service }, function(data){
            $scope['tableCriticalLogsData'] = data.critical_events;
            $scope['tableWarningLogsData'] = data.warning_events;
            $scope.tableCriticalLogs = createngTableParams('tableCriticalLogsData', ngTableParams, $scope, $filter, 10);
            $scope.tableWarningLogs = createngTableParams('tableWarningLogsData', ngTableParams, $scope, $filter, 10);
        });
    }]);

function getDefaultParameters(key, count) {
    var defaults = {
        page: 1,
        count: count || 10,
        debugMode:true
    };

    if (window.localStorage){
        if (window.localStorage.getItem(key)){
            return JSON.parse(window.localStorage.getItem(key));
        } else {
          return defaults;
        }
    }
    else {
        return defaults;
    }
}

function createngTableParams(key, ngTableParams, $scope, $filter, count){
    return new ngTableParams(getDefaultParameters(key, count),
        {
            total: $scope[key].length, // length of data
            getData: function($defer, params) {
                var data = $scope[key];
                params.total(data.length); // needed for pagination

                var orderedData = params.sorting() ?
                    $filter('orderBy')(data, params.orderBy()) : data;

                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));

                var paramsForStorage = {
                    sorting: params.sorting(),
                    count: params.count(),
                    page: params.page()
                };

                if (window.localStorage) {
                    window.localStorage.setItem(key, JSON.stringify(paramsForStorage));
                }
            }
        });
}