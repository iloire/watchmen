var faker = require('faker');

exports = module.exports = (function(){

  function getRandomName(long) {
    if (long) {
      return faker.internet.domainName() + ' ' + faker.finance.accountName(); // long enough for layout testing purposes
    }
    else {
      return faker.internet.domainName();
    }
  }

  function generateDummyService (i){
    return {
      name: getRandomName(false),
      interval: 60 * 1000,
      failureInterval: 20 * 1000,
      url: 'http://apple.com',
      port: 443,
      timeout: 10000,
      warningThreshold: 3000,
      pingServiceName: 'http-head'
    };
  }

  return {
    generate : function(number){
      var services = [];
      for (var i = 0; i < number; i++) {
        services.push(generateDummyService(i));
      }
      return services;
    }
  };

})();