var assert = require ('assert');

describe('services', function(){

  var services_loader = require ('../lib/services');

  describe('reporting list', function(){
    it('should load all services', function(done){
      services_loader.load_services(function(err, services){
        assert.equal (services.length, 27); // not the best idea. It should be changed when services are stored in DB
        done();
      });
    });

    it('should load all enabled services', function(done){
      services_loader.load_services(function(err, services){
        var services_enabled = services.filter(function(item){return item.enabled;});
        assert.equal (services_enabled.length, 26); // as above
        done();
      });      
    });
  });
});
