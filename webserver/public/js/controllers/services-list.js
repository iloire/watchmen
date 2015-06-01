(function () {

  'use strict';

  var SERVICES_POLLING_INTERVAL = 3000;
  var timer;

  var watchmenControllers = angular.module('watchmenControllers');

  watchmenControllers.controller('ServiceListCtrl',
      ['$scope', '$filter', '$timeout', 'Report', 'Service', 'usSpinnerService', 'ngTableUtils',
        function ($scope, $filter, $timeout, Report, Service, usSpinnerService, ngTableUtils) {

          var key = 'tableServicesData';
          $scope[key] = [];
          $scope.tableParams = ngTableUtils.createngTableParams(key, $scope, $filter, 25);

          function scheduleNextTick() {
            $timeout.cancel(timer);
            timer = $timeout(function () {
              reload(scheduleNextTick, loadServicesErrHandler);
            }, SERVICES_POLLING_INTERVAL);
          }

          function loadServicesErrHandler(err) {
            $scope.errorLoadingServices = "Error loading data from remote server";
            console.error(err);
            scheduleNextTick();
          }

          function reload(doneCb, errorHandler){
            $scope.services = Report.query(function (services) {
              $scope[key] = services;
              $scope.tableParams.reload();

              $scope.errorLoadingServices = null; // reset error
              transition.loaded();
              doneCb();
            }, errorHandler);
          }

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

          $scope.delete = function(id){
            if (confirm('Are you sure you want to delete this service and all its data?')) {
              Service.delete ({id: id}, function(){
                reload(function(){}, function(){
                  $scope.errorLoadingServices = "Error loading data from remote server";
                });
              });
            }
          };

          $scope.reset = function(id){
            if (confirm('Are you sure you want to reset this service\'s data?')) {
              Service.reset ({id: id}, function(){
                reload(function(){}, function(){
                  $scope.errorLoadingServices = "Error loading data from remote server";
                });
              });
            }
          };

          reload(scheduleNextTick, loadServicesErrHandler);

        }]);
})();
