var services_loader = require ('../../lib/services')

module.exports.add_routes = function (app, storage){
	//-------------------------------
	// Url log detail
	//-------------------------------
	app.get('/details', function(req, res){
		var max = 100;
		var host = req.query ['host'], url = req.query ['url'], port = req.query['port'];
		var service = services_loader.load_services().filter(function(service){
			return (service.host.host == host && service.url == url && service.host.port == port);
		});
		if (!service.length){
			return res.end('not found');
		}

		storage.report_one(service[0], function (err, service){
			res.render('details.html', {
				title: service.url_info,
				service: service,
				critical_events: service.data.events.filter(function(item){return item.type == 'critical';}),
				warning_events: service.data.events.filter(function(item){return item.type == 'warning';})
			});
		});
	});

	//-------------------------------
	// List of hosts and url's
	//-------------------------------
	app.get('/', function(req, res){
		res.render('list.html', {title: 'watchmen'});
	});

	//-------------------------------
	// Get list (JSON)
	//-------------------------------
	app.get('/getdata', function(req, res){
		var services = services_loader.load_services();
		storage.report_all(services, function (err, data){
			res.json(data);
		});
	});

};
