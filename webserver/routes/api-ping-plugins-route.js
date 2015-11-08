var express = require('express');

exports = module.exports.getRoutes = function (){

  var PREFIX_PING_PLUGIN = 'watchmen-ping-';

  var router = express.Router();
  var pkgJson = require(__dirname + '../../../package.json');

  function getOptions(dep){
      try {
        var pluginFactory = require(dep);
        var plugin = new pluginFactory();
        return plugin.getDefaultOptions();
      } catch (e) {
        console.error('Error parsing options for ' + dep);
        console.error(e);
        return {};
      }
  }

  /**
   * Returns the list of available plugin ping plugins (ex: watchmen-ping-http-head)
   * Those plugins should be installed in node_modules with the prefix "watchmen-ping"
   */
  router.get('/', function(req, res){

    var pingServicesPluginsInPackageJson = [];
    for (var dep in pkgJson.dependencies) {
      if (dep.indexOf(PREFIX_PING_PLUGIN) === 0){
        pingServicesPluginsInPackageJson.push(dep);
      }
    }

    var plugins = pingServicesPluginsInPackageJson.map(function(pluginName){
      return {
        name: pluginName.replace(PREFIX_PING_PLUGIN, ''),
        options: getOptions(pluginName)
      };
    });

    return res.json(plugins);
  });

  return router;

};