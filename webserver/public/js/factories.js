(function () {

  'use strict';

  angular.module('watchmenFactories', ['ngResource']).factory('Service', function($resource) {
    return $resource('/api/report/services/:id');
  });

})();