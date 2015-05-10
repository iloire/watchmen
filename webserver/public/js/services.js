//(function() {
//
//    'use strict';
//
//    var EXPIRATION = 10 * 1000; //ms
//    var SERVICES_LIST_CACHE_KEY = 'services-cache';
//
//    var watchmenServices = angular.module('watchmenServices', ['ngResource']);
//
//    watchmenServices.factory('Service', ['$resource', '$cacheFactory',
//        function($resource, $cacheFactory) {
//
//            var cache = $cacheFactory('watchmen-Services');
////
//            return {
//
//
//                getAll: function(cb) {
//                    var services = cache.get(SERVICES_LIST_CACHE_KEY);
//                    if (services) {
//                        if (services.expiration < +new Date()){
//                            services = null;
//                        }
//                        else {
//                            return cb(services.data);
//                        }
//                    }
//
//                    if (!services) {
//                        services = $resource('/api/services', {}, {
//                            query: {
//                                method: 'GET',
//                                isArray: true
//                            }
//                        }).query(cb);
//                        cache.put(SERVICES_LIST_CACHE_KEY, {
//                            data: services,
//                            expiration: +new Date() + EXPIRATION
//                        });
//                    }
//                    console.log(services)
//                    return services;
//                },
//                getDetails: function(options, cb){
//                    return $resource('services?host=:host&service=:service', {}, {
//                        query: {
//                            method:'GET',
//                            isArray:true,
//                            cache: $cacheFactory.get('$http')
//                        }
//                    }).get(options, cb);
//                }
//            };
//        }]);
//})();
