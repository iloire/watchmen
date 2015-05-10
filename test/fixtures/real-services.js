var _ = require('lodash');

exports = module.exports = (function(){

  var MIN = 60 * 1000; //ms

  var DEFAULTS = {
    interval: 2 * MIN,
    failureInterval: MIN,
    timeout: 10000,
    warningThreshold: 3000,
    pingServiceName: 'http',
    pingServiceOptions: {}
  };

  function generateService (service){
    return _.defaults(service, DEFAULTS);
  }

  var services = [];
  services.push(generateService({ name: 'apple', url: 'https://apple.com', port: 443 }));
  services.push(generateService({ name: 'node', url: 'http://node.com', port: 80 }));
  services.push(generateService({ name: 'amazon', url: 'http://amazon.com', port: 80 }));
  services.push(generateService({ name: 'npm', url: 'http://npm.org', port: 80 }));
  services.push(generateService({ name: 'yahoo', url: 'http://yahoo.com', port: 80 }));
  services.push(generateService({ name: 'alexa', url: 'http://alexa.com', port: 80 }));
  services.push(generateService({ name: 'github', url: 'http://github.com', port: 80 }));
  services.push(generateService({ name: 'bitbucket', url: 'http://bitbucket.com', port: 80 }));
  services.push(generateService({ name: 'youtube', url: 'http://youtube.com', port: 80 }));
  services.push(generateService({ name: 'facebook', url: 'http://facebook.com', port: 80 }));
  services.push(generateService({ name: 'twitter', url: 'http://twitter.com', port: 80 }));
  services.push(generateService({ name: 'linkedin', url: 'http://linkedin.com', port: 80 }));
  services.push(generateService({ name: 'bing', url: 'http://bing.com', port: 80 }));
  services.push(generateService({ name: 'blogspot', url: 'http://blogspot.com', port: 80 }));
  services.push(generateService({ name: 'oracle', url: 'http://oracle.com', port: 80 }));
  services.push(generateService({ name: 'microsoft', url: 'http://microsoft.com', port: 80 }));
  services.push(generateService({ name: 'business', url: 'http://business.com', port: 80 }));
  services.push(generateService({ name: 'bbc', url: 'http://bbc.com', port: 80 }));
  services.push(generateService({ name: 'google', url: 'http://google.com', port: 80 }));
  services.push(generateService({ name: 'google maps', url: 'http://maps.google.com', port: 80 }));

  return services;

})();