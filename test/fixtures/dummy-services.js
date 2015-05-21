exports = module.exports = (function(){

  var NUMBER_SERVICES = 300;

  function generateDummyService (i){
    return {
      name: 'service n' + i,
      interval: 60 * 1000,
      failureInterval: 20 * 1000,
      url: 'http://apple.com',
      port: 443,
      timeout: 10000,
      warningThreshold: 3000,
      pingServiceName: 'http-head'
    }
  }

  var services = [];
  for (var i = 0; i < NUMBER_SERVICES; i++) {
    services.push(generateDummyService(i));
  }

  return services;

})();