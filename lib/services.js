
var hosts = require('../config/hosts');
var config = require('../config/general');

var services = null;

module.exports.load_services = function (){

	if (services){ //cache services collection
		return services;
	}

	services = [];

	hosts.forEach (function(host){

		host.protocol = host.protocol || 'http';

		host.urls.forEach(function(service){
			service.host = host;
			delete service.host.urls; //avoid circular references

			//friendly display of this service
			service.url_info = host.name + ' - ' + host.host + ':'+ host.port  + service.url +
				' [' + service.method + ']';

			//config response time limit
			service.warning_if_takes_more_than = service.warning_if_takes_more_than || host.warning_if_takes_more_than;

			//config ping interval
			service.ping_interval = service.ping_interval || host.ping_interval || 60;

			//config failed ping interval
			service.failed_ping_interval = service.failed_ping_interval || host.failed_ping_interval || 70;

			//config alert notifications
			service.alert_to = service.alert_to || host.alert_to || config.notifications.to;
			//resolve if service is enabled
			if (service.enabled === undefined){ //no enabled config found for service
				service.enabled = host.enabled;
			}
			if (service.enabled === undefined){ //no enabled config found for host
				service.enabled = true;
			}

			services.push (service);
		});
	});

	return services;
};