exports = module.exports = (function(){

  var DEFAULT_TARGET_UPTIME = 0.90;
  var DEFAULT_TARGET_WARNING_PERCENTAGE = 0.02;

  function getRandomResponse(service) {
    var err = Math.random() >= DEFAULT_TARGET_UPTIME ? 'Error connecting with server - message' : null;
    var response = { statusCode: err ? 500 : 200 };
    var latency;
    if (Math.random() <= DEFAULT_TARGET_WARNING_PERCENTAGE) { // warning
      latency = Math.round((service.warningThreshold) + (Math.random() * service.warningThreshold));
    } else{
      latency = Math.round(service.warningThreshold - service.warningThreshold * Math.random());
    }
    return { error: err, body: 'body', response: response, latency: latency };
  }

  return {
    getRandomResponse : getRandomResponse
  }
})();