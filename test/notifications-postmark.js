var assert = require ('assert');
var PostmarkNotificationsFactory = new require('../lib/notifications/postmark/postmark');

describe('Postmark notifications', function(){

    var defaultConfig;
    var message;

    beforeEach(function(){
        defaultConfig = {
            from: 'me@domain.com',
            API_KEY: 'MY-FAKE-API-KEY',
        };

        message = {
            to: ['me@domain.com'],
            title: 'this is a title',
            body: 'this is the body'
        };
    });

    describe('service configuration', function(){

        it('"from" field is required', function(done){
            defaultConfig.from = null;
            var postMarkService = new PostmarkNotificationsFactory(defaultConfig);
            postMarkService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid configuration') === 0, err);
                done();
            });
        });

        it('"API_KEY" field is required', function(done){
            defaultConfig.API_KEY = null;
            var postMarkService = new PostmarkNotificationsFactory(defaultConfig);
            postMarkService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid configuration') === 0, err);
                done();
            });
        });

        // TODO: this is calling Postmark. Need to mock?
        //it('all required fields should send', function(done){
        //    var postMarkService = new PostmarkNotificationsFactory(defaultConfig);
        //    postMarkService.send(message, function(err, data){
        //        assert.ifError(err);
        //        done();
        //    })
        //});

    });

    describe('message configuration', function(){
        it('"to" field is required', function(done){
            message.to = null;
            var postMarkService = new PostmarkNotificationsFactory(defaultConfig);
            postMarkService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid options') === 0, err);
                done();
            });
        });

        it('"to" field must be an array', function(done){
            message.to = "hi@domain.com";
            var postMarkService = new PostmarkNotificationsFactory(defaultConfig);
            postMarkService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('"to" field must be an array') === 0, err);
                done();
            });
        });

        it('"title" field is required', function(done){
            message.title = null;
            var postMarkService = new PostmarkNotificationsFactory(defaultConfig);
            postMarkService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid options') === 0, err);
                done();
            });
        });

        it('"body" field is required', function(done){
            message.body = null;
            var postMarkService = new PostmarkNotificationsFactory(defaultConfig);
            postMarkService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid options') === 0, err);
                done();
            });
        });

    });

});
