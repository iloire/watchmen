var assert = require ('assert');
var net = require('net');

describe('smtp service', function(){

  var smtp = require ('../lib/ping_services/smtp');
  var mockService = { host: { host: 'localhost', port: 2333 } };
  var mockedServerPort = 9615;

  it('error callback', function(done){
    smtp.ping (mockService, function(error){
      assert.ok(error.indexOf('Could not open socket') > -1, error);
      done();
    });
  });

  it('timeout callback', function(done){
    var mockedServer = net.createServer(function (socket) {}).listen(mockedServerPort, function(){
      var mockService = { host: { host: 'localhost', port: mockedServerPort }, timeout: 1 };
      smtp.ping (mockService, function(error){
        assert.ok(error.indexOf('Timeout') > -1, error);
        mockedServer.close(done);
      });
    });
  });

});
