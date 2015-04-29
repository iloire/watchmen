var storage_mocked = require ('./../../test/lib/mock/storage_mocked');
var debug = require('debug')('data-load');

var Watchmen = require('../../lib/watchmen.js');
var mocked_ping_service = require('../../test/lib/mock/request_mocked');

var watchmen = new Watchmen(null, new storage_mocked(null));

var service = {
  host : { host: 'www.correcthost.com', port:'80', name : 'test'},
  url : '/',
  ping_interval: 4,
  failed_ping_interval: 5,
  warning_if_takes_more_than: 1500, //miliseconds
  method : 'get',
  expected : {statuscode: 200, contains: ''},

  ping_service: mocked_ping_service // mock
};

var numberTimes = 100000;
var current = 0;

function run (service, cb){
  watchmen.ping({service:service, timestamp: +new Date()}, function(err, status){
    if (current < numberTimes){
      if (current % 1000 == 0) {
        debug('processing ', current);
      }
      current++;
      setTimeout(function(){ // get out of the stack
        run (service, cb);
      },0);
    }
    else {
      cb(null, 'done!');
    }
  });
}

run (service, function(err, msg){
  console.log(msg);
});