var moment = require('moment');
var express = require('express');
var reporterFactory = require('./../../lib/reporter');
var accessFilter = require('./../../lib/service-access-filter');

module.exports.getRoutes = function (storage){

  var reporter = new reporterFactory(storage);

  var router = express.Router();

  /**
   * Load service report
   */

  router.get('/services/:id', function(req, res){
    if (!req.params.id) {
      return res.status(400).json({ error: 'ID parameter not found' });
    }
    reporter.getService(req.params.id, function (err, service){
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }

      service = accessFilter.filterReports(service, req.user ? req.user.email : null);

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json(service);
    });
  });

  /**
   * Load services report
   */

  router.get('/services', function(req, res){
    reporter.getServices({}, function (err, services){
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }
      res.json(accessFilter.filterReports(services, req.user ? req.user.email : null));
    });
  });

  return router;

};
