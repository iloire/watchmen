
/**
 * Convenient HTTP ping service mock for testing purposes
 */

exports = module.exports = (function(){

  return {

    mockedResponse : {},

    ping: function (service, callback) {
      var res = this.mockedResponse;
      setTimeout(function () { // simulate async
        callback(res.error, res.body, res.response, res.latency);
      }, res.latency);
    }

  };

})();
