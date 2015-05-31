(function () {

  'use strict';


  var watchmenControllers = angular.module('watchmenControllers');

  /**
   * Add service
   */

  watchmenControllers.controller('ServiceAddCtrl', ['$scope', '$state', '$filter', '$stateParams', 'Service',
    function ($scope, $state, $filter, $stateParams, Service) {
      $scope.service = new Service();

      // defaults
      $scope.service.timeout = 10000;
      $scope.service.warningThreshold = 5000;
      $scope.service.interval = 60000;
      $scope.service.failureInterval = 30000;
      $scope.service.port = 80;
      $scope.service.pingServiceName = 'http-head';

      $scope.addService = function () {
        $scope.service.$save(function () {
          $state.go('services');
        }, function(response){
          console.log(response);
          $scope.serviceAddErrors = response.data.errors;
        });
      };

      $scope.cancel = function () {
        $state.go('services');
      };

    }]);

})();
