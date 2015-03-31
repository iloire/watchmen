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
    var err = 'invalid configuration for service AWS-SES. Please fix it in config/notification-services/aws-ses. missing field:';

    if (!this.config.from)
        return err  + '"from"';

    if (!this.config.region)
        return err  + '"region"';

    if (!this.config.AWS_KEY)
        return err  + '"AWS_KEY"';

    if(!this.config.AWS_SECRET)
        return err  + '"AWS_SECRET"';
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