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