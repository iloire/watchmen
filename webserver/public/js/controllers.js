(function () {

  'use strict';

  /* Controllers */

  var SERVICES_POLLING_INTERVAL = 3000;
  var timer;

  var watchmenControllers = angular.module('watchmenControllers', []);

  /**
   * Services list
   */

  watchmenControllers.controller('ServiceListCtrl',
      ['$scope', '$filter', '$timeout', 'Service', 'ngTableParams', 'usSpinnerService',
        function ($scope, $filter, $timeout, Service, ngTableParams, usSpinnerService) {

          var transition = {
            loading: function () {
              usSpinnerService.spin('spinner-1');
              $scope.loading = true;
            },
            loaded: function () {
              usSpinnerService.stop('spinner-1');
              $scope.loading = false;
            }
          };

          var key = 'tableServicesData';
          transition.loading();

          $scope[key] = [];
          $scope.tableParams = createngTableParams(key, ngTableParams, $scope, $filter, 25);

          (function tick($scope, Service) {

            function scheduleNextTick() {
              $timeout.cancel(timer);
              timer = $timeout(function () {
                tick($scope, Service);
              }, SERVICES_POLLING_INTERVAL);
            }

            function errorHandler(err) {
              $scope.errorLoadingServices = "Error loading data from remote server";
              console.error(err);
              scheduleNextTick();
            }

            $scope.services = Service.getAll(function (services) {
              $scope.errorLoadingServices = null; // reset error

              $scope[key] = services;
              $scope.tableParams.reload();
              $scope.servicesDown = services.filter(function (service) {
                return service.data && service.data.status === 'error';
              }).length;

              transition.loaded();

              scheduleNextTick();
            }, errorHandler);

          })($scope, Service);

        }]);

  /**
   * Service details
   */

  watchmenControllers.controller('ServiceDetailCtrl', ['$scope', '$filter', '$routeParams', 'Service', 'ngTableParams', 'usSpinnerService',
    function ($scope, $filter, $routeParams, Service, ngTableParams, usSpinnerService) {
      usSpinnerService.spin('spinner-1');
      $scope.loading = true;
      $scope.showConfig = false;

      $scope.serviceDetails = Service.getDetails({serviceId: $routeParams.host + ',' + $routeParams.service}, function (data) {
        usSpinnerService.stop('spinner-1');
        $scope.loading = false;

        angular.forEach(data, function(value, key){
          $scope[key] = value;
        });

        $scope.tableCriticalLogs = createngTableParams('critical_events', ngTableParams, $scope, $filter, 10);
        $scope.tableWarningLogs = createngTableParams('latency_warnings_last_24_hours', ngTableParams, $scope, $filter, 10);

        // charting
        var chartSize = {height: 200};
        var max;

        // TODO:
        if (data.latency_last_week_mean) {
          max = 2 * data.latency_last_week_mean;
        }

        if (data.latency_last_hour_list.length > 20) {
          $scope.showLastHourChart = true;
          Charting.renderLatencyChart({
            data: data.latency_last_hour_list,
            id: '#chart-last-hour',
            size: chartSize,
            max: max
          });
        }

        if (data.latency_last_24_hours_list.length > 6) {
          $scope.showLast24Chart = true;
          Charting.renderLatencyChart({
            data: data.latency_last_24_hours_list,
            id: '#chart-last-24-hours',
            size: chartSize,
            max: max
          });
        }

        if (data.latency_last_week_list.length > 3) {
          $scope.showLastWeekChart = true;
          Charting.renderLatencyChart({
            data: data.latency_last_week_list,
            id: '#chart-last-week',
            size: chartSize,
            x_format: '%d/%m',
            max: max
          });
        }
      });
    }]);


  /**
   * Returns local stored or default parameters for ngTable.
   * @param key
   * @param pageSize
   * @returns {Object} parameters
   */

  function getDefaultParameters(key, pageSize) {
    var defaults = {
      page: 1,
      count: pageSize || 10,
      debugMode: true
    };

    if (window.localStorage) {
      if (window.localStorage.getItem(key)) {
        return JSON.parse(window.localStorage.getItem(key));
      } else {
        return defaults;
      }
    }
    else {
      return defaults;
    }
  }

  function createngTableParams(key, NgTableParams, $scope, $filter, count) {
    return new NgTableParams(getDefaultParameters(key, count),
        {
          total: $scope[key].length, // length of data
          getData: function ($defer, params) {
            var data = $scope[key];
            params.total(data.length); // needed for pagination

            var orderedData = params.sorting() ?
                $filter('orderBy')(data, params.orderBy()) : data;

            var paginatedData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());

            $defer.resolve(paginatedData);

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
})();