(function () {

  'use strict';


  var watchmenControllers = angular.module('watchmenControllers');

  /**
   * Service details
   */

  watchmenControllers.controller('ServiceDetailCtrl', ['$scope', '$filter', '$stateParams', 'Service', 'ngTableUtils', 'usSpinnerService', '$timeout',
    function ($scope, $filter, $stateParams, Service, ngTableUtils, usSpinnerService,$timeout) {

      usSpinnerService.spin('spinner-1');
      $scope.loading = true;
      $scope.showConfig = false;

      $scope.serviceDetails = Service.get({id: $stateParams.id}, function (data) {
        usSpinnerService.stop('spinner-1');
        $scope.loading = false;

        $scope.latestOutages = data.status.latestOutages;

        // charting
        var chartSize = {height: 150};

        var latencyLastHour = data.status.lastHour.latency;
        var latencyLast24Hours = data.status.last24Hours.latency;
        var latencyLastWeek = data.status.lastWeek.latency;

        var maxLastHour = _.max(latencyLastHour.list, function(item) {return item.l;});
        var maxLast24Hours = _.max(latencyLast24Hours.list, function(item) {return item.l;});
        var maxLastWeek = _.max(latencyLastWeek.list, function(item) {return item.l;});

        var max = _.max([maxLastHour.l, maxLast24Hours.l, maxLastWeek.l]);

        $timeout(function(){

          //experimental
          if (data.status.last24Hours.outages.length > 0) {
            Charting.renderOutages({
              outages: data.status.last24Hours.outages,
              id: '#chart-outages-last-24hour',
              size: chartSize
            });
          }

          if (latencyLastHour.list.length > 0) { // at least one successful ping
            $scope.showLastHourChart = true;
            Charting.renderLatency({
              threshold: data.service.warningThreshold,
              latency: latencyLastHour.list,
              id: '#chart-last-hour',
              size: chartSize,
              max: max
            });
          }

          if (latencyLast24Hours.list.length > 8) {
            $scope.showLast24Chart = true;
            Charting.renderLatency({
              threshold: data.service.warningThreshold,
              latency: latencyLast24Hours.list,
              id: '#chart-last-24-hours',
              size: chartSize,
              max: max
            });
          }

          if (latencyLastWeek.list.length > 1) {
            $scope.showLastWeekChart = true;
            Charting.renderLatency({
              threshold: data.service.warningThreshold,
              latency: latencyLastWeek.list,
              id: '#chart-last-week',
              size: chartSize,
              x_format: '%d/%m',
              max: max
            });
          }
        },0);
      });

    }]);

})();
