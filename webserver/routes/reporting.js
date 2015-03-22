var services_loader = require ('../../lib/services');
var moment = require('moment');

module.exports.add_routes = function (app, storage){

  app.all('*', function(req, res, next){
    res.locals.dateformat = function (date, format) {
      if (format==='ago'){
        return moment(date).fromNow();
      }
      else if (format==='timespan'){
        return moment(date).fromNow(true);
      }
      else{
        return moment(date).format(format || 'MMM D YYYY, hh:mm');
      }
    };
    next();
  });

  //-------------------------------
  // Url log detail
  //-------------------------------
  app.get('/details', function(req, res){

    services_loader.load_services(function(err, services){
      var service = services.filter(function(service){
        return (service.host.name === req.query ['host'] && service.name === req.query ['service']);
      })[0];

      if (!service){
        return res.end('not found');
      }

      storage.report_one(service, function (err, service){
        res.render('details.html', {
          title: service.url_info,
          service : service,
          eventsSince : moment (+new Date() - service.remove_events_older_than_seconds * 1000),
          status: service.data ? service.data.status : 'unavailable', // no data collected yet
          critical_events: service.data ? service.data.events.filter(function(item){return item.type == 'critical';}) : [],
          warning_events: service.data ? service.data.events.filter(function(item){return item.type == 'warning';}) : []
        });
      });
    });
  });

  //-------------------------------
  // List of hosts and url's
  //-------------------------------
  app.get('/', function(req, res){
    res.render('list.html', {
      title: 'watchmen'
    });
  });

  //-------------------------------
  // Get list (JSON)
  //-------------------------------
  app.get('/getdata', function(req, res){
    services_loader.load_services(function(err, services){
      storage.report_all(services, function (err, data){
        res.json(data);
      });
    });
  });

};
