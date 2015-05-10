var moment = require('moment');
var express = require('express');
var reporterFactory = require('./../../lib/reporter');

module.exports.getRoutes = function (storage){

  var reporter = new reporterFactory(storage);

  var router = express.Router();

  /**
   * Load service report
   */

  // TODO: auth
  router.get('/services/:id', function(req, res){
    if (!req.params.id) {
      return res.status(400).json({ error: 'ID parameter not found' });
    }
    reporter.getService(req.params.id, function (err, service){
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }
      res.json(service);
    });
  });

  /**
   * Load services report
   */

  // TODO: auth
  router.get('/services', function(req, res){
    reporter.getServices({}, function (err, services){
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }
      res.json(services);
    });
  });

  return router;

};
