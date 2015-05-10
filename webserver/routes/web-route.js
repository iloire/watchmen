var config = require('../../config/web');
var express = require('express');

module.exports.getRoutes = function (){

  var router = express.Router();

  function serveIndex(req, res){
    res.render('index.html', {
      title: 'watchmen'
    });
  }

  router.all('*', function(req, res, next){
    res.locals.user = req.user;
    res.locals.baseUrl = config.baseUrl;
    res.locals.ga_analytics_ID = config.ga_analytics_ID;
    next();
  });

  router.get('/services', serveIndex);
  router.get('/services/:id/view', serveIndex);
  router.get('/', serveIndex);

  return router;
};
