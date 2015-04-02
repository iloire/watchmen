module.exports = (function(){

  var expirationForEventsInDays = 10;

  return {
    remove_events_older_than_seconds : 60 * 60 * 24 * expirationForEventsInDays
  }

})();