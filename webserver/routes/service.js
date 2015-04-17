var services_loader = require ('../../lib/services');
var moment = require('moment');
var auth = require('../auth');

module.exports.add_routes = function (app, storage){

    /**
     * Returns an array of the services available
     * If serviceId parameter is provide, it will load details for that particular service
     * @param req.query.serviceId "<host-name>,<service-name>"
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

                storage.report_one(service, function (err, serviceReport) {
                    if (err) {
                        return res.status(500).json({ error: err });
                    }

                    serviceReport = serviceReport || {};

                    var events = serviceReport.events || [];

                    res.json({
                        service: service,
                        eventsSince : moment (+new Date() - service.remove_events_older_than_seconds * 1000),
                        status: serviceReport.status || 'unavailable', // no data collected yet

                        critical_events: events.filter(function(item){return item.type == 'critical';}),

                        // the next properties have the following structure {arr: [t: <unis timestamp>,l:<int>], mean: <int> }
                        latency_last_hour_list: serviceReport.latency_last_hour ? serviceReport.latency_last_hour.arr : [],
                        latency_last_24_hours_list: serviceReport.latency_last_24_hours ? serviceReport.latency_last_24_hours.arr : [],
                        latency_last_week_list: serviceReport.latency_last_week ? serviceReport.latency_last_week.arr : [],

                        latency_last_hour_mean: serviceReport.latency_last_hour ? serviceReport.latency_last_hour.mean : 0,
                        latency_last_24_hours_mean: serviceReport.latency_last_24_hours ? serviceReport.latency_last_24_hours.mean : 0,
                        latency_last_week_mean: serviceReport.latency_last_week ? serviceReport.latency_last_week.mean : 0,

                        latency_warnings_last_24_hours : serviceReport.latency_warnings_last_24_hours ? serviceReport.latency_warnings_last_24_hours : [],

                        number_outages_last_24_hours: serviceReport.number_outages_last_24_hours || 0
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
