/**
 * Amazon AWS SES
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html
 */
var defaultConfig = require('../../../../config/notifications/services/aws-ses');

exports = module.exports = AWSSes;

function AWSSes (config) {
    this.config = config || defaultConfig;
}

AWSSes.prototype.checkConfiguration = function() {
    if (!this.config.from || !this.config.region || !this.config.AWS_KEY || !this.config.AWS_SECRET){
        return 'invalid configuration for service AWS-SES. Please fix it in config/notification-services/aws-ses';
    }
}

AWSSes.prototype.send = function(options, cb) {

    var errors = this.checkConfiguration();
    if (errors){
        return cb(errors);
    }

    if (!options.to || !options.title || !options.body){
        return cb('invalid options calling AWS-SES');
    }

    var aws = require('aws-sdk');

    var ses = new aws.SES({
        apiVersion: '2010-12-01', // lock API version
        region: this.config.region,
        accessKeyId: this.config.AWS_KEY,
        secretAccessKey: this.config.AWS_SECRET
    });

    ses.sendEmail( {
        Message: {
            Subject: {
                Data: options.title
            },
            Body: {
                Text: {
                    Data: options.body,
                }
            }
        },
        Source: this.config.from,
        Destination: { ToAddresses: options.to }
    }, cb);

}