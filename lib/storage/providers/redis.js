var util = require ('util');
var REMOVE_EVENTS_OLDER_THAN_SECONDS = 60 * 60 * 24 * 10; // default is 10 days. You can configure it in a per-host basis.

function StorageRedis(options){
  this.options = options || {};
  this.redis = require("redis").createClient(this.options.port || 6379, this.options.host || '127.0.0.1');
  this.redis.select (this.options.db || 0);
}

util.inherits(StorageRedis, require ('../base'));

StorageRedis.prototype.get_status = function (service, callback){
  this.redis.get(this._get_key(service), function(err, data){
    callback(err, err ? null : JSON.parse(data));
  });
};

StorageRedis.prototype.update_status = function (service, status, callback){

  var self = this;
  var multi = this.redis.multi();

  var eventsKey = self._get_key(service)+ ':events';

  //1. save events
  if (status.events && status.events.length){
    status.events.forEach(function(ev){
      multi.zadd(eventsKey, status.timestamp, JSON.stringify(ev));
    });
  }

  //2. save status
  delete status.events; //already saved in sorted set
  multi.set(this._get_key(service), JSON.stringify(status));

  //3. cleanup. Remove older events
  var remove_events_older_than_seconds = isNaN(service.host.remove_events_older_than_seconds) ? REMOVE_EVENTS_OLDER_THAN_SECONDS : service.host.remove_events_older_than_seconds;
  var newestTimestamp =  +new Date() - remove_events_older_than_seconds * 1000;
  multi.zremrangebyscore(eventsKey, -Infinity, newestTimestamp);

  multi.exec(function(err, replies) {
    callback(err);
  });
};

//----------------------------------------------
// Reporting
//----------------------------------------------
StorageRedis.prototype.report_all = function (services, callback){

  var self = this;

  var multi = this.redis.multi();

  for (var i = 0, l = services.length; i < l ;  i++) {
    multi.get(self._get_key(services[i]));
  }

  multi.exec(function(err, replies) {
    for (var i = 0, l = services.length; i < l ;  i++) {
      services[i].data = JSON.parse(replies[i]);
    }
    callback(err, {services: services});
  });
};

StorageRedis.prototype.report_one = function (service, callback){

  var multi = this.redis.multi();

  multi.get(this._get_key(service));
  multi.zrevrange(this._get_key(service) + ':events',0, -1);

  multi.exec(function(err, replies) {
    if (replies[0]){
      service.data = JSON.parse(replies[0]);
      service.data.events = replies[1].map(function(ev){return JSON.parse(ev);}); //parse each entry
    }
    callback(err, service);
  });
};

//available on redis
StorageRedis.prototype.flush_database = function (callback){
  this.redis.flushdb(callback);
};

StorageRedis.prototype.quit = function (callback){
  this.redis.quit();
};

module.exports = StorageRedis;