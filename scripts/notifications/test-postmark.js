var postMarkFactory = require('../../lib/notifications/services/postmark/postmark');

var testEmailAddress = 'xxxxx@domain.com';

var config = {
    from: testEmailAddress,
    API_KEY: process.env.WATCHMEN_POSTMARK_API_KEY
};

var postMarkService = new postMarkFactory(config);

postMarkService.send({
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