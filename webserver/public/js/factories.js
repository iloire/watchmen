(function () {

  'use strict';

  angular.module('watchmenFactories', []);

  var factories = angular.module('watchmenFactories');

  factories.factory('Report', function ($resource) {
    return $resource('/api/report/services/:id');
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