exports = module.exports = (function(){

  var PREFIX_PING_PLUGIN = 'watchmen-plugin-';
  var pkgJson = require(__dirname + '../../package.json');

  return {

    /**
     * Load plugins from node_modules
     * @param watchmen
     * @param cb
     */

    loadPlugins : function (watchmen, options, cb) {
      console.log('\nloading plugins from nodemodules... '.gray);
      for (var dep in pkgJson.dependencies) {
        if (dep.indexOf(PREFIX_PING_PLUGIN) === 0){
          new require(dep)(watchmen);
        }
      }
      cb();
    }
  };

})();