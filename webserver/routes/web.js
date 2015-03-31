var config = require('../../config/web');

module.exports.add_routes = function (app){

  app.all('*', function(req, res, next){
    res.locals.user = req.user;
    res.locals.ga_analytics_ID = config.ga_analytics_ID;
    next();
  });

  app.get('/', function(req, res){
    res.render('index.html', {
      title: 'watchmen'
    });
  });
};
