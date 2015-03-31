var defaultConfig = require('../../../../config/notifications/services/postmark');
var postmark = require("postmark");

exports = module.exports = Postmark;

function Postmark(config) {
  this.config = config || defaultConfig;
}

Postmark.prototype.getName = function() {
  return 'postmark';
};

Postmark.prototype.checkConfiguration = function() {
  var err = 'invalid configuration for service Postmark. Please fix it in config/notification-services/postmark. missing field: ';

  if (!this.config.from)
    return err  + '"from"';

  if (!this.config.API_KEY)
    return err  + '"API_KEY"';
};

/**
 * Postmark send
 * @param options.to {Array} email addresses
 * @param options.title {string} subject
 * @param options.body {string} email body
 * @param cb
 * @returns {*}
 */
Postmark.prototype.send = function (options, cb) {

  var errors = this.checkConfiguration();
  if (errors){
    return cb(errors);
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