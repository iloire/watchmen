module.exports.add_routes = function (app){

  app.all('*', function(req, res, next){
    res.locals.user = req.user;
    next();
  });

  app.get('/', function(req, res){
    res.render('index.html', {
      title: 'watchmen'
    });
  });
};
