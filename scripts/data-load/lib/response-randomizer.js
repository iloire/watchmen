exports = module.exports = (function(){

  var DEFAULT_TARGET_UPTIME = 0.99;
  var DEFAULT_TARGET_WARNING_PERCENTAGE = 0.02;

  function getRandomResponse(service, targetUptime, frecuencyWarning) {
    targetUptime = targetUptime || DEFAULT_TARGET_UPTIME;
    frecuencyWarning = frecuencyWarning || DEFAULT_TARGET_WARNING_PERCENTAGE;

    var err = Math.random() >= targetUptime ? 'Error connecting with server - message' : null;
    var response = { statusCode: err ? 500 : 200 };
    var latency;
    if (Math.random() <= frecuencyWarning) { // warning
      latency = Math.round((service.warningThreshold) + (Math.random() * service.warningThreshold));
    } else{
      latency = Math.round(service.warningThreshold - service.warningThreshold * Math.random());
    }
    return { error: err, body: 'body', response: response, latency: latency };
  }

  return {
    getRandomResponse : getRandomResponse
  };
})();