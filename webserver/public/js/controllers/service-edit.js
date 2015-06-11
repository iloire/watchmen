(function () {

  'use strict';


  var watchmenControllers = angular.module('watchmenControllers');

  /**
   * Add service
   */

  watchmenControllers.controller('ServiceEditCtrl', ['$scope', '$state', '$filter', '$stateParams', 'Service',
    function ($scope, $state, $filter, $stateParams, Service) {

      $scope.editServiceTitle = "Update service";
      $scope.service = Service.get({id: $stateParams.id});

      $scope.save = function () {
        $scope.service.$save(function () {
          $state.go('services');
        }, function(response){
          console.error(response);
          if (response && response.data && response.data.errors) {
            $scope.serviceAddErrors = response.data.errors;
          }
        });
      };

      $scope.cancel = function () {
        $state.go('services');
      };

    }]);

})();
