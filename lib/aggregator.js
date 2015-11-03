var spigot = require("stream-spigot");
var agg = require("timestream-aggregates");
var concat = require("concat-stream");

exports = module.exports = (function(){

  return {
    aggregate: function(arr, timeunit, cb){
      spigot({objectMode: true}, arr)
          .pipe(agg.mean("t", timeunit))
          .pipe(concat(cb));
    }
  };

})();