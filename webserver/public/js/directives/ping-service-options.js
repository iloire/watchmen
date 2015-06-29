var watchmenDirectives = angular.module('watchmenDirectives');

watchmenDirectives.directive('pingServiceOptions', function (PingPlugins) {
  return {
    restrict: 'EA', //E = element, A = attribute, C = class, M = comment
    templateUrl: 'ping-service-options.html',
    scope: false,
    link: function (scope) {

      function updateOptions() {
        for (var i = 0; i < scope.pingServices.length; i++) {
          if (scope.pingServices[i].name === scope.service.pingServiceName) {
            scope.selectedPingServiceOptions = $.extend({}, scope.pingServices[i].options,
                (scope.service.pingServiceOptions || {})[scope.service.pingServiceName]);
          }
        }
      }

      scope.pingServices = PingPlugins.query(function(){
        scope.$watch('service.pingServiceName', function() {
          updateOptions();
        });
      });

      scope.hasPingServiceOptions = function(){
        return !angular.equals({}, scope.selectedPingServiceOptions);
      };
    }
  };
});
