var config = require('../../config/web');

module.exports.add_routes = function (app){

  function serveIndex(req, res){
    res.render('index.html', {
      title: 'watchmen'
    });
  }

  app.all('*', function(req, res, next){
    res.locals.user = req.user;
    res.locals.baseUrl = config.baseUrl;
    res.locals.ga_analytics_ID = config.ga_analytics_ID;
    next();
  });

  app.get('/details/*', serveIndex);
  app.get('/', serveIndex);
};
