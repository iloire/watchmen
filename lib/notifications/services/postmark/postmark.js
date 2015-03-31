var defaultConfig = require('../../../../config/notifications/services/postmark');
var postmark = require("postmark");

exports = module.exports = Postmark;

function Postmark(config) {
  this.config = config || defaultConfig;
}

/**
 * Postmark send
 * @param options.to {Array} email addresses
 * @param options.title {string} subject
 * @param options.body {string} email body
 * @param cb
 * @returns {*}
 */
Postmark.prototype.send = function (options, cb) {
  if (!this.config.from || !this.config.API_KEY) {
    return cb('invalid configuration for service Postmark');
  }

  if (!options.to || !options.title || !options.body) {
    return cb('invalid options calling Postmark');
  }

  if (!Array.isArray(options.to)){
    return cb('"to" field must be an array')
  }

  var client = new postmark.Client(this.config.API_KEY);

  var payload = {
    'From' : this.config.from,
    'To': options.to.join(','),
    'Subject': options.title,
    'TextBody': options.body
  };

  client.sendEmail(payload, cb);
}