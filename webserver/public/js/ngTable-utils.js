(function () {

  'use strict';

  var SAVE_PARAMS_IN_LOCALSTORAGE = true;

  angular.module('watchmenFactories').factory('ngTableUtils', function(ngTableParams) {

    /**
     * Returns local stored or default parameters for ngTable.
     * @param key
     * @param pageSize
     * @returns {Object} parameters
     */

    function getDefaultParameters(key) {
      var defaults = {};

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

    function createngTableParams(key, $scope, $filter) {
      return new ngTableParams(getDefaultParameters(key),
          {
            total: $scope[key].length, // length of data
            counts: [],
            getData: function ($defer, params) {
              var data = $scope[key];
              var orderedData = params.sorting() ? $filter('orderBy')(data, params.orderBy()) : data;
              $defer.resolve(orderedData);

              var paramsForStorage = {
                sorting: params.sorting()
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