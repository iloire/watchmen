(function () {

  'use strict';

  var SERVICES_POLLING_INTERVAL = 3000;
  var timer;

  var watchmenControllers = angular.module('watchmenControllers');

  watchmenControllers.controller('ServiceListCtrl',
      ['$scope', '$filter', '$timeout', 'Report', 'usSpinnerService', 'ngTableUtils',
        function ($scope, $filter, $timeout, Report, usSpinnerService, ngTableUtils) {

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

          transition.loading();

          var key = 'tableServicesData';
          $scope[key] = [];
          $scope.tableParams = ngTableUtils.createngTableParams(key, $scope, $filter, 25);

          (function tick($scope, Report) {

            function scheduleNextTick() {
              $timeout.cancel(timer);
              timer = $timeout(function () {
                tick($scope, Report);
              }, SERVICES_POLLING_INTERVAL);
            }

            function errorHandler(err) {
              $scope.errorLoadingServices = "Error loading data from remote server";
              console.error(err);
              scheduleNextTick();
            }

            $scope.services = Report.query(function (services) {
              $scope[key] = services;
              $scope.tableParams.reload();

              $scope.errorLoadingServices = null; // reset error
              transition.loaded();
              scheduleNextTick();
            }, errorHandler);

          })($scope, Report);

        }]);
})();
