var walk = require('walk');
var path = require('path');

exports = module.exports = (function(){

  return {

    /**
     * Load plugins from PLUGINS_LOCATION
     * @param watchmen
     * @param cb
     */

    loadPlugins : function (watchmen, options, cb) {
      var walker = walk.walk(options.location);
      console.log('\nloading plugins... '.gray);
      walker.on("file", function (root, fileStats, next) {
        if (fileStats.name === 'plugin.js') {
          new require(path.join('../', root, fileStats.name))(watchmen);
          console.log('loaded plugin '.gray + root);
        }
        next();
      });

      walker.on("end", cb);
    }
  }

})();