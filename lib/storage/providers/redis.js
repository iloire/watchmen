var util = require ('util');
var spigot = require("stream-spigot");
var agg = require("timestream-aggregates");
var concat = require("concat-stream");
var debug = require('debug')('redis-storage');

var REMOVE_EVENTS_OLDER_THAN_SECONDS = 60 * 60 * 24 * 10; // default is 10 days. You can configure it in a per-host basis.
var EVENTS_KEY_SUFIX = "events";
var LATENCY_KEY_SUFIX = "latency";
var LATENCY_WARNING_LAST_24_HOURS_KEY_SUFIX = LATENCY_KEY_SUFIX + ":last24hour";
var OUTAGES_KEY_SUFIX = "outages";
var OUTAGES_LAST_24_HOURS_KEY_SUFIX = OUTAGES_KEY_SUFIX + ":last24Hours";
var OUTAGES_LAST_WEEK = OUTAGES_KEY_SUFIX + ":lastWeek";

function StorageRedis(options){
  this.options = options || {};
  this.redis = require("redis").createClient(this.options.port || 6379, this.options.host || '127.0.0.1');
  this.redis.select (this.options.db || 0);
}

exports = module.exports = StorageRedis;

util.inherits(StorageRedis, require ('../base'));

StorageRedis.prototype.get_status = function (service, callback){
  this.redis.get(this._get_key(service), function(err, data){
    callback(err, err ? null : JSON.parse(data));
  });
};

StorageRedis.prototype.update_status = function (service, status, callback){

  debug('update status - start');

  var self = this;
  var multi = this.redis.multi();

  var errorsLast24HoursKey = self._get_key(service) + ':' + OUTAGES_LAST_24_HOURS_KEY_SUFIX;
  var errorsLastWeekKey = self._get_key(service) + ':' + OUTAGES_LAST_WEEK;
  var eventsKey = self._get_key(service) + ':' + EVENTS_KEY_SUFIX;
  var latencyKey =  self._get_key(service) + ':' + LATENCY_KEY_SUFIX;
  var latencyWarningsLast24Hours = self._get_key(service) + ':' + LATENCY_WARNING_LAST_24_HOURS_KEY_SUFIX;

  //1. save events
  if (status.events && status.events.length){
    status.events.forEach(function(ev){
      if (ev.status == "error") { // TODO: separate event for this?
        multi.zadd(errorsLast24HoursKey, status.timestamp, status.timestamp);
        multi.zadd(errorsLastWeekKey, status.timestamp, status.timestamp);
      }
      multi.zadd(eventsKey, status.timestamp, JSON.stringify(ev));
    });
  }

  //2. save status object
  delete status.events; //already saved in sorted set
  multi.set(this._get_key(service), JSON.stringify(status));

  //3. save latency
  multi.zadd(latencyKey, status.timestamp, status.elapsed_time);
  if (status.elapsed_time > service.warning_if_takes_more_than) {
    multi.zadd(latencyWarningsLast24Hours, status.timestamp, status.timestamp);
  }

  //4. cleanup. Remove older events
  var remove_events_older_than_seconds = isNaN(service.remove_events_older_than_seconds) ? REMOVE_EVENTS_OLDER_THAN_SECONDS : service.remove_events_older_than_seconds;
  var newestTimestamp =  +new Date() - remove_events_older_than_seconds * 1000;
  multi.zremrangebyscore(eventsKey, -Infinity, newestTimestamp);
  multi.zremrangebyscore(latencyKey, -Infinity, newestTimestamp);

  var now = +new Date();
  var yesterday = now - 1000 * 60 * 60 * 24;
  multi.zremrangebyscore(errorsLast24HoursKey, -Infinity, yesterday);
  multi.zremrangebyscore(latencyWarningsLast24Hours, -Infinity, yesterday);

  var lastweek = now - 1000 * 60 * 60 * 24 * 7;
  multi.zremrangebyscore(errorsLastWeekKey, -Infinity, lastweek);

  multi.exec(function(err, results) {
    debug('update status - end');
    callback(err);
  });
};

//----------------------------------------------
// Reporting
//----------------------------------------------
StorageRedis.prototype.report_all = function (services, callback){

  debug('report all - start');

  var self = this;

  var multi = this.redis.multi();
  var now = +new Date();
  var yesterday = now - 1000 * 60 * 60 * 24;

  for (var i = 0, l = services.length; i < l ;  i++) {
    multi.get(self._get_key(services[i]));
    multi.zcount(this._get_key(services[i]) + ':' + OUTAGES_LAST_24_HOURS_KEY_SUFIX, yesterday, now);
    multi.zcount(this._get_key(services[i]) + ':' + LATENCY_WARNING_LAST_24_HOURS_KEY_SUFIX, yesterday, now);
    multi.zrevrange(this._get_key(services[i]) + ':' + LATENCY_KEY_SUFIX, 0, 20);
  }

  multi.exec(function(err, replies) {
    for (var i = 0, l = services.length; i < l ;  i++) {
      services[i].data = JSON.parse(replies[4 * i]);
      services[i].outages_last_24hours = replies[4 * i + 1];
      services[i].warnings_last_24Hours = replies[4 * i + 2];
      services[i].latest_mean_latency = mean(replies[4 * i + 3]);
    }
    debug('report all - end');
    callback(err, { services: services });
  });
};

StorageRedis.prototype.report_one = function (service, callback){

  function warningFilter(record) {
    return record.l > service.warning_if_takes_more_than;
  }

  debug('report one - start');

  var multi = this.redis.multi();

  multi.get(this._get_key(service));

  var now = +new Date();

  var last_hour = now - 1000 * 60 * 60;
  var yesterday = now - 1000 * 60 * 60 * 24;
  var lastweek = now - 1000 * 60 * 60 * 24 * 7;

  multi.zrevrangebyscore(this._get_key(service) + ':' + EVENTS_KEY_SUFIX, now, lastweek);

  // latency arrays for charting
  multi.zrevrangebyscore(this._get_key(service) + ':' + LATENCY_KEY_SUFIX, now, last_hour, 'withscores');
  multi.zrevrangebyscore(this._get_key(service) + ':' + LATENCY_KEY_SUFIX, now, yesterday, 'withscores');
  multi.zrevrangebyscore(this._get_key(service) + ':' + LATENCY_KEY_SUFIX, now, lastweek, 'withscores');

  multi.zcount(this._get_key(service) + ':' + OUTAGES_LAST_24_HOURS_KEY_SUFIX, "-inf", "inf");

  multi.exec(function(err, replies) {
    if (err) { return callback(err); }

    debug('redis multi.exec');

    if (replies[0]){

      // This could be more efficient if data was pre-aggregated in redis,
      // though for the target intervals the performance seems to be just kind of fine for rendering the
      // service details (< 70ms)

      var aggregatedDataLast24Hours = parseLatencyDataFromZset(replies[3]);
      debug('parse 24 hours data');

      aggregateLatencyData(aggregatedDataLast24Hours.arr, 'hour', function(arrLast24Hours){
        debug('aggregate 24 hours data');
        var aggregatedDataLastWeek = parseLatencyDataFromZset(replies[4]);
        debug('parse last week data');
        aggregateLatencyData(aggregatedDataLastWeek.arr, 'day', function(arrLastWeek) {
          debug('aggregate last week data');

          var lasthourData = parseLatencyDataFromZset(replies[2]);
          debug('parse last hour data');

          var ret = {
            status: JSON.parse(replies[0]),
            events:  replies[1].map(function(ev){ return JSON.parse(ev); }), //parse each entry

            latency_last_hour: lasthourData,
            latency_last_24_hours: { arr: arrLast24Hours, mean: aggregatedDataLast24Hours.mean },
            latency_last_week: { arr: arrLastWeek, mean: aggregatedDataLastWeek.mean },

            latency_warnings_last_24_hours: aggregatedDataLast24Hours.arr.filter(warningFilter),

            number_outages_last_24_hours: replies[5]
          };

          debug('created return object');

          callback(null, ret);
        });
      });
    } else {
      callback(null, null); // no data found
    }
  });
};

//available on redis
StorageRedis.prototype.flush_database = function (callback){
  this.redis.flushdb(callback);
};

StorageRedis.prototype.quit = function (callback){
  this.redis.quit();
};

/**
 * Converts ["124", "1428222697560", "123", "1428222692345"]
 *
 * into
 *
 * [{t: 1428222697560, l: 124}, {t: 1428222692345, l: 123}]
 *
 * @param zset
 * @returns {*}
 */
function parseLatencyDataFromZset(zset){
  var arr = [];
  var currentObj;
  var accLatency = 0;
  for (var i = 0; i < zset.length; i++) {
    if (i % 2 == 0) { // odd
      currentObj = { l: +zset[i] }; // latency
      if (!isNaN(zset[i]) && zset[i] > 0) { // valid positive numbers
        accLatency+=(+zset[i]);
      }
    } else {
      currentObj.t = +zset[i]; // timestamp
      arr.push(currentObj);
    }
  }
  return {
    arr: arr,
    mean: Math.round(accLatency / arr.length)
  };
}

/**
 * Aggregate latency information hourly
 */
function aggregateLatencyData (arr, timeunit, cb) {
  spigot({objectMode: true}, arr)
      .pipe(agg.mean("t", timeunit))
      .pipe(concat(cb));
}

function mean (arr){
  var sum = 0;
  for (var l = 0; l < arr.length; l++) {
    sum+=(+arr[l]);
  }
  return Math.round(sum/arr.length);
}