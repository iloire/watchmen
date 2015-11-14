(function () {

  'use strict';


  var watchmenControllers = angular.module('watchmenControllers');

  /**
   * Service details
   */

  watchmenControllers.controller('ServiceDetailCtrl',

    function (
        $scope,
        $filter,
        $stateParams,
        Report,
        ngTableUtils,
        usSpinnerService,
        $timeout) {

      function getChartSize() {
        return {height: 200, width: $('.chart-container').width()};
      }

      function loading(){
        usSpinnerService.spin('spinner-1');
        $scope.loading = true;
      }

      function loaded(){
        usSpinnerService.stop('spinner-1');
        $scope.loading = false;
      }

      function errHandler (err){
        console.log(err);
        loaded();
        var msg = err.statusText;
        if (err.data && err.data.error){
          msg = err.data.error;
        }
        $scope.errorLoadingService = msg;
      }

      loading();
      $scope.serviceDetails = Report.get({id: $stateParams.id}, function (data) {
        loaded();
        $scope.latestOutages = data.status.latestOutages;

        // charting
        var latencyLastHour = data.status.lastHour.latency;
        var latencyLast24Hours = data.status.last24Hours.latency;
        var latencyLastWeek = data.status.lastWeek.latency;

        var maxLastHour = _.max(latencyLastHour.list, function (item) {
          return item.l;
        });
        var maxLast24Hours = _.max(latencyLast24Hours.list, function (item) {
          return item.l;
        });
        var maxLastWeek = _.max(latencyLastWeek.list, function (item) {
          return item.l;
        });

        var max = _.max([maxLastHour.l, maxLast24Hours.l, maxLastWeek.l]);

        var charts = [];
        $timeout(function () {
          var chartSize = getChartSize();
          if (latencyLastHour.list.length > 0) { // at least one successful ping
            $scope.showLastHourChart = true;
            charts.push(Charting.render({
              threshold: data.service.warningThreshold,
              latency: latencyLastHour.list,
              outages: data.status.lastHour.outages,
              id: '#chart-last-hour',
              size: chartSize,
              max: max
            }));
          }

          if (latencyLast24Hours.list.length > 8) {
            $scope.showLast24Chart = true;
            charts.push(Charting.render({
              threshold: data.service.warningThreshold,
              latency: latencyLast24Hours.list,
              outages: data.status.last24Hours.outages,
              id: '#chart-last-24-hours',
              size: chartSize,
              max: max
            }));
          }

          if (latencyLastWeek.list.length > 1) {
            $scope.showLastWeekChart = true;
            charts.push(Charting.render({
              threshold: data.service.warningThreshold,
              latency: latencyLastWeek.list,
              outages: data.status.lastWeek.outages,
              id: '#chart-last-week',
              size: chartSize,
              x_format: '%d/%m',
              max: max
            }));
          }

          function onWindowResize () {
            for (var i = 0; i < charts.length; i++) {
              charts[i].resize(getChartSize());
            }
          }

          $scope.$on('$destroy', function(){
            $(window).off("resize", onWindowResize);
          });

          $(window).resize(onWindowResize);

        }, 0);
      }, errHandler);

      $scope.showConfig = false;
      $scope.isAdmin = window.isAdmin;

      $scope.services = Report.query(function(){  // for sidebar
        $scope.services.sort(function(a, b){
          return a.status.last24Hours.uptime - b.status.last24Hours.uptime; });
      });

    });

})();
