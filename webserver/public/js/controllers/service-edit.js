(function () {

  'use strict';


  var watchmenControllers = angular.module('watchmenControllers');

  /**
   * Add service
   */

  watchmenControllers.controller('ServiceEditCtrl', ['$scope', '$state', '$filter', '$stateParams', 'Service', 'usSpinnerService',
    function ($scope, $state, $filter, $stateParams, Service, usSpinnerService) {

      function loading(){
        usSpinnerService.spin('spinner-1');
        $scope.loading = true;
      }

      function loaded(){
        usSpinnerService.stop('spinner-1');
        $scope.loading = false;
      }

      loading();

      $scope.editServiceTitle = "Update service";

      $scope.service = Service.get({id: $stateParams.id}, function(){
        loaded();
      }, function(err){
        console.error(err);
        loaded();
      });

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
