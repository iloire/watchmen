(function(){

    'use strict';

    /* App Module */

    var watchmenApp = angular.module('watchmenApp', [
        'ui.router',
        'angularSpinner',
        'ngTable', // table sorting and pagination
        'angularMoment',
        'angularMSTime',
        'watchmenControllers',
        'watchmenFactories',
        'ngResource'
    ]);

    watchmenApp.config(function($stateProvider, $locationProvider, $urlRouterProvider) {

        $locationProvider.html5Mode(true);

        $stateProvider.state('services', {
            url: '/services',
            templateUrl: 'service-list.html',
            controller: 'ServiceListCtrl'
        }).state('viewService', {
            url: '/services/:id/view',
            templateUrl: 'service-detail.html',
            controller: 'ServiceDetailCtrl'
        }).state('newService', {
            url: '/services/add',
            templateUrl: 'service-add.html',
            controller: 'ServiceAddCtrl'
        }).state('editService', {
            url: '/services/:id/edit',
            templateUrl: 'service-edit.html',
            controller: 'ServiceEditCtrl'
        });

        $urlRouterProvider.when('/', '/services');
    });

})();

(function () {

  'use strict';

  angular.module('watchmenFactories', []);

  var factories = angular.module('watchmenFactories');

  factories.factory('Report', function ($resource) {
    return $resource('/api/report/services/:id');
    //return $resource('http://ec2-54-204-149-175.compute-1.amazonaws.com:3334/api/report/services/:id');
  });

  factories.factory('Service', function ($resource) {
    return $resource('/api/services/:id',
        {id: '@id'}, {
          reset: {
            method: 'POST',
            url: '/api/services/:id/reset'
          }
        });
  });

})();
(function () {

  'use strict';

  var SAVE_PARAMS_IN_LOCALSTORAGE = false;

  angular.module('watchmenFactories').factory('ngTableUtils', function(ngTableParams) {

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

      if (SAVE_PARAMS_IN_LOCALSTORAGE && window.localStorage) {
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

    function createngTableParams(key, $scope, $filter, count) {
      return new ngTableParams(getDefaultParameters(key, count),
          {

            total: $scope[key].length, // length of data

            getData: function ($defer, params) {

              var data = $scope[key];

              params.total(data.length); // needed for pagination

              var orderedData = params.sorting() ? $filter('orderBy')(data, params.orderBy()) : data;

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

    return {
      createngTableParams: createngTableParams
    };

  });

})();
(function () {

  'use strict';

  window.Charting = window.Charting || {};

  /**
   *
   * @param options.size
   * @param options.id
   * @param options.columns
   * @param options.x_format
   * @returns {*}
   */
  Charting.generateLatencyChart = function (options) {

    return c3.generate({
      size: options.size,
      bindto: options.id,
      legend: {
        position: 'right'
      },
      data: {
        x: 'x',
        columns: options.columns,
        types: {
          Latency: 'area-spline',
          Threshold: 'spline'
        },
        colors: {
          Latency: 'green',
          Threshold: 'orange'
        }
      },
      axis: {
        y: {
          max: isNaN(options.max) ? 0 : options.max,
          tick: {
            values: [200, 500, 1000, 2000, 3000, 4000, 5000, 7000, 10000, 15000, 20000, 30000]
          }
        },
        x: {
          type: 'timeseries',
          tick: {
            format: options.x_format || '%H:%M'
          }
        }
      },
      tooltip: {
        format: {
          title: function (d) {
            return moment(d).format('DD/MMM/YY HH:mm') + ' (' + moment(d).fromNow() + ')';
          },
          value: function (value, ratio, id) {
            if (id == 'Outages') {
              return moment.duration(value).humanize();
            }
            else {
              return value + ' ms.';
            }
          }
        }
      }
    });

  };


})();

(function () {

  'use strict';

  window.Charting = window.Charting || {};

  var MINUTE = 60 * 1000;
  var HOUR = 60 * MINUTE;

  /**
   *
   * @param options.size
   * @param options.id
   * @param options.columns
   * @param options.x_format
   * @returns {*}
   */
  Charting.generateOutagesChart = function (options) {

    return c3.generate({
      size: options.size,
      bindto: options.id,
      legend: {
        position: 'right'
      },
      data: {
        x: 'x',
        columns: options.columns,
        types: {
          Outages: 'bar'
        },
        colors: {
          Outages: 'red'
        }
      },
      axis: {
        y: {

        },
        x: {
          min: +new Date() - 24 * HOUR,
          max: +new Date(),
          type: 'timeseries',
          tick: {
            format: options.x_format || '%H:%M'
          }
        }
      },
      tooltip: {
        format: {
          title: function (d) {
            return moment(d).format('DD/MMM/YY HH:mm') + ' (' + moment(d).fromNow() + ')';
          },
          value: function (value, ratio, id) {
            return moment.duration(value * 1000).humanize();
          }
        }
      }
    });
  };

})();

(function () {

  'use strict';

  window.Charting = window.Charting || {};

  var MINUTE = 60 * 1000;
  var HOUR = 60 * MINUTE;

  Charting.renderOutages = function (options) {

    var outagesData = parseArrayObjectsForCharting(options.outages, 'timestamp', 'downtime');
    var outagesSerie = outagesData.data.map(function(y) { return y / 1000; }); // seconds
    
    var timeSerie = outagesData.time;

    timeSerie.splice(0, 0, +new Date() - 24 * HOUR);
    timeSerie.push(+new Date());

    outagesSerie.splice(0, 0, 0);
    outagesSerie.push(0);

    // create labels
    timeSerie.splice(0, 0, 'x');
    outagesSerie.splice(0, 0, 'Outages');

    return Charting.generateOutagesChart({
      size: options.size,
      id: options.id,
      x_format: options.x_format,
      columns: [timeSerie, outagesSerie],
      max: options.max
    });
  };

  /**
   * Renders a C3 chart
   * @param data
   */
  Charting.renderLatency = function (options) {

    var latencyData = parseArrayObjectsForCharting(options.latency, 't', 'l');

    var latencySerie = latencyData.data;
    var timeSerie = latencyData.time;

    timeSerie.splice(0, 0, 'x');
    latencySerie.splice(0, 0, 'Latency');

    var threshold = latencySerie.slice();
    threshold[0] = 'Threshold';
    threshold = threshold.map(function (item) {
      if (isNaN(item)) {
        return item;
      }
      else {
        return options.threshold;
      }
    });

    return Charting.generateLatencyChart({
      size: options.size,
      id: options.id,
      x_format: options.x_format,
      columns: [timeSerie, latencySerie, threshold],
      max: options.max
    });
  };

  /**
   * Converts [{t: 1428220800000, l: 123.23}]
   *
   * into
   *
   * { time : [1428220800000], data: [123] }
   *
   */
  function parseArrayObjectsForCharting(arr, fieldTime, fieldData) {
    var time = [];
    var latency = [];
    for (var i = 0; i < arr.length; i++) {
      time.push([arr[i][fieldTime]]);
      latency.push(Math.round([arr[i][fieldData]]));
    }
    return {time: time, data: latency};
  }

})();

angular.module('watchmenControllers', []);
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

(function () {

  'use strict';


  var watchmenControllers = angular.module('watchmenControllers');

  /**
   * Service details
   */

  watchmenControllers.controller('ServiceDetailCtrl', ['$scope', '$filter', '$stateParams', 'Report', 'ngTableUtils', 'usSpinnerService', '$timeout',
    function ($scope, $filter, $stateParams, Report, ngTableUtils, usSpinnerService, $timeout) {

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
      $scope.showConfig = false;

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
        var defaultChartWidth = $('.view-frame').width();
        var chartSize = {height: 150, width: defaultChartWidth};

        $timeout(function () {

          //experimental
          if (data.status.last24Hours.outages.length > 0) {
            Charting.renderOutages({
              outages: data.status.last24Hours.outages,
              id: '#chart-outages-last-24hour',
              size: {height: 100, width: defaultChartWidth}
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
        }, 0);
      }, errHandler);

    }]);

})();

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

          function reload(doneCb, errorHandler) {
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

          $scope.serviceFilter = function (row) {
            if ($scope.filterRestrictedToMe && !row.service.restrictedTo) {
              return false;
            }
            return row.service.name.indexOf($scope.query || '') > -1;
          };

          $scope.delete = function (id) {
            if (confirm('Are you sure you want to delete this service and all its data?')) {
              Service.delete({id: id}, function () {
                reload(function () {
                }, function () {
                  $scope.errorLoadingServices = "Error loading data from remote server";
                });
              });
            }
          };

          $scope.reset = function (id) {
            if (confirm('Are you sure you want to reset this service\'s data?')) {
              Service.reset({id: id}, function () {
                reload(function () {
                }, function () {
                  $scope.errorLoadingServices = "Error loading data from remote server";
                });
              });
            }
          };

          reload(scheduleNextTick, loadServicesErrHandler);

        }]);
})();
