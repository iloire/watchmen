var Watchmen = require ('../lib/watchmen');
var assert = require ('assert');
var storage_mocked = require ('./lib/mock/storage_mocked');
var mocked_ping_service = require ('./lib/mock/request_mocked');

describe('ping service', function(){

  var ERROR_RESPONSE = {error: 'mocked   error', body : null, response : null, timeDiff : 0};
  var SUCCESS_RESPONSE = { error: null, body: 'ok',response: {body: 'ok', statusCode: 200}, timeDiff: 300};
  var LATENCY_WARNING_RESPONSE = { error: null, body: 'ok',response: {body: 'ok', statusCode: 200}, timeDiff: 1600};

  var service;

  beforeEach(function(){
    service = {
      host : {host: 'www.correcthost.com', port:'80', name : 'test'},
      url : '/',
      ping_interval: 4,
      failed_ping_interval: 5,
      warning_if_takes_more_than: 1500, //miliseconds
      method : 'get',
      expected : {statuscode: 200, contains: ''},

      ping_service: mocked_ping_service // mock
    };
  });

  it('should emit "error" when ping fails', function(done){
    mocked_ping_service.mocked_response = ERROR_RESPONSE;
    var failed_request_timestamp = +new Date();

    var watchmen = new Watchmen(null, new storage_mocked(null));
    watchmen.on('service_error', function (service, status){
      assert.equal (status.last_check, failed_request_timestamp, 'should have last_check property');
      assert.equal (status.running_since, failed_request_timestamp, 'should have running_since property');
      assert.equal (status.status, 'error', 'should have status error');
      assert.equal (status.last_outage, failed_request_timestamp, 'should have last_outage property');
      assert.equal (status.next_attempt_secs, service.failed_ping_interval, 'should have failed ping interval');
      assert.equal (status.events[0].status, 'error', 'should have an error event');
      assert.equal (status.down_timestamp, failed_request_timestamp, 'should have a down_timestamp property');
      assert.ok (!status.down_time_last_request, 'should not have a down time value');
      assert.equal (JSON.stringify(status.prev_state),'{}', 'should not have previous state');
      assert.equal (status.running_since, failed_request_timestamp, 'should have a running_since value');
      assert.ok (!status.up_since, 'should have not up_since property defined');
      assert.equal (status.uptime, 0, 'should have zero uptime');
      done(null);
    });
    watchmen.ping({service:service, timestamp: failed_request_timestamp}, function(err){ });
  });

  it('should emit "success" when ping success', function(done){
    var timestamp = new Date();
    mocked_ping_service.mocked_response = SUCCESS_RESPONSE;

    var watchmen = new Watchmen(null, new storage_mocked(null));
    watchmen.on('service_ok', function (service, status) {
      assert.equal (status.last_check, timestamp, 'should have last_check property');
      assert.equal (status.running_since, timestamp, 'should have a running_since value');
      assert.equal (status.next_attempt_secs, service.ping_interval, 'should have standard interval');
      assert.equal (status.status, 'success', 'should have "success" error');
      assert.equal (status.up_since, timestamp, 'should have up_since');
      done();
    });
    watchmen.ping({service:service, timestamp: timestamp}, function(err){ });
  });

  it ('should emit "service_back" when service is back', function(done){
    var failureTimestamp = new Date();
    mocked_ping_service.mocked_response = ERROR_RESPONSE;

    var storage = new storage_mocked(null);
    var watchmen = new Watchmen(null, storage);

    var successTimestamp = new Date();
    // error result
    watchmen.ping({service:service, timestamp: failureTimestamp}, function(err, status){
      // successful result
      mocked_ping_service.mocked_response = SUCCESS_RESPONSE;

      watchmen.on('service_back', function (service, status) {
        assert.ok (status.prev_state, 'should have previous state');
        assert.ok (!status.prev_state.prev_state, 'should not have nexted previous state');
        assert.equal (status.last_outage, failureTimestamp, 'should have last_outage property');
        assert.equal (status.next_attempt_secs, service.ping_interval, 'should have standard interval');
        assert.equal (status.events.length, 1, 'should have service_back event');
        assert.ok (!status.down_timestamp, 'should have not a down_timestamp value');
        assert.equal (status.up_since, successTimestamp, 'should have up_since timestamp');
        assert.equal (status.down_time_last_request, (successTimestamp-failureTimestamp)/1000, 'should have down time for last request'); //in seconds
        assert.equal (status.down_time_acc, (successTimestamp-failureTimestamp)/1000, 'should have total down time'); //in seconds
        assert.equal (status.uptime, 0, 'should have zero uptime');
        done();
      });

      storage.set_status(status);

      watchmen.ping({service:service, timestamp: successTimestamp}, function(err){});
    });
  });

  it('should emit "warning" when ping takes too long', function(done){
    var timestamp = new Date();
    mocked_ping_service.mocked_response = LATENCY_WARNING_RESPONSE;

    var watchmen = new Watchmen(null, new storage_mocked(null));
    watchmen.on('service_warning', function (service, status) {
      assert.equal (status.last_check, timestamp, 'should have last_check property');
      assert.equal (status.running_since, timestamp, 'should have a running_since value');
      assert.equal (status.next_attempt_secs, service.ping_interval, 'should have standard interval');
      assert.equal (status.status, 'success', 'should have "success" error');
      assert.equal (status.up_since, timestamp, 'should have up_since');
      assert.ok (!status.down_timestamp, 'should have not a down_timestamp value');
      done();
    });
    watchmen.ping({service:service, timestamp: timestamp}, function(err){ });
  });
});