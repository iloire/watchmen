var moment = require('moment');
var express = require('express');
var debug = require('debug')('service-route');
var serviceValidator = require('./../../lib/service-validator');

module.exports.getRoutes = function (storage){

    var router = express.Router();

    /**
     * Add service
     */
    //TODO: auth
    router.post('/services', function(req, res){
        var service = req.body;

        debug('loading services');
        var errors = serviceValidator.validate(service);
        if (errors.length) {
            return res.status(400).json({ errors: errors });
        }
        storage.addService(service, function(err, id){
            if (err) {
                return res.status(500).json({ error: err });
            }
            debug('loading loaded');
            return res.status(200).json({ id: id });
        });
    });

    /**
     * Load service
     */

    router.get('/services/:id', function(req, res){
        if (!req.params.id) {
            return res.status(400).json({ error: 'ID parameter not found' });
        }
        storage.getService(req.params.id, function (err, service){
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err });
            }
            res.json(service);
        });
    });

    /**
     * Load services
     */

    // TODO: filter by auth
    router.get('/services', function(req, res){
        storage.getServices({}, function (err, services){
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err });
            }
            console.log(services)
            res.json(services);
        });
    });

    return router;

};
