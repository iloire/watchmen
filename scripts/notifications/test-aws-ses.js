// you should use an amazon verified address in both "from" and "to" fields until you get
// production access: http://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html

var sesFactory = require('../../lib/notifications/services/aws-ses/aws-ses');

var testEmailAddress = 'xxxxx@domain.com';

var config = {
    from: testEmailAddress,
    region: 'us-east-1',
    AWS_KEY: process.env.WATCHMEN_AWS_KEY,
    AWS_SECRET: process.env.WATCHMEN_AWS_SECRET
};

var sesService = new sesFactory(config);

sesService.send({
    to: [testEmailAddress],
    title: 'email test',
    body: 'body'
}, function(err){
    if (err) {
        console.error(err);
    } else {
        console.log('ok!');
    }
});