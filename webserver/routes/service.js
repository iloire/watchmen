var services_loader = require ('../../lib/services');
var moment = require('moment');
var auth = require('../auth');

module.exports.add_routes = function (app, storage){

    /**
     * Get services.
     * Returns an array of services unless there is only one result
     * @param req.query.host filters by host name
     * @param req.query.service filters by service name
     */
    app.get('/services', function(req, res){
        services_loader.load_services(function(err, services){
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err });
            }

            if (req.query.serviceId) { //return one
                services = auth.filterAuthorizedServers(services, req).filter(function(service){
                    return (req.query.serviceId === service.host.name + ',' + service.name);
                });

                if (services.length == 0) {
                    return res.status(404).json({error: 'not found'});
                }
                var service = services[0];

                storage.report_one(service, function (err, service){
                    res.json({
                        service : service,
                        eventsSince : moment (+new Date() - service.remove_events_older_than_seconds * 1000),
                        status: service.data ? service.data.status : 'unavailable', // no data collected yet
                        critical_events: service.data ? service.data.events.filter(function(item){return item.type == 'critical';}) : [],
                        warning_events: service.data ? service.data.events.filter(function(item){return item.type == 'warning';}) : []
                    });
                });

            } else { // return all
                storage.report_all(auth.filterAuthorizedServers(services, req), function (err, data){
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: err });
                    }
                    res.json(data.services);
                });
            }
        });
    });

};
