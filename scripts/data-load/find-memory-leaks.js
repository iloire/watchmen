/**
 * This script helps finding memory leaks in watchmen while during pings
 * It uses a mocked storage.
 */
var storageMocked = require ('./../../test/lib/mock/storage-mocked');
var debug = require('debug')('data-load');

var Watchmen = require('../../lib/watchmen.js');
var mockedPingService = require('../../test/lib/mock/request-mocked');

var watchmen = new Watchmen(null, new storageMocked(null));

var service = {
  host : { host: 'www.correcthost.com', port:'80', name : 'test'},
  url : '/',
  interval: 4000,
  failedInterval: 5000,
  warningThreshold: 1500, //miliseconds
  method : 'get',
  expected : { statuscode: 200, contains: '' },

  ping_service: mockedPingService // mock // TODO
};

var numberTimes = 100000;
var current = 0;

function run (service, cb){
  watchmen.ping({service:service, timestamp: +new Date()}, function(err, status){
    if (current < numberTimes){
      if (current % 1000 === 0) {
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