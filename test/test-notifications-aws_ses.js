var assert = require ('assert');
var AWSSesNotificationsFactory = new require('../lib/notifications/services/aws-ses/aws-ses');

describe('aws-ses notifications', function(){

    var defaultConfig;
    var message;

    beforeEach(function(){
        defaultConfig = {
            region: 'us-east-1',
            from: 'me@domain.com',
            AWS_KEY: 'my-key',
            AWS_SECRET: 'my-secret'
        };

        message = {
            to: ['me@domain.com'],
            title: 'this is a title',
            body: 'this is the body'
        };
    });

    describe('service configuration', function(){

        it('"from" config field is required', function(done){
            defaultConfig.from = null;
            var awsService = new AWSSesNotificationsFactory(defaultConfig);
            awsService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid configuration') === 0, err);
                done();
            });
        });

        it('"region" config field is required', function(done){
            defaultConfig.region = null;
            var awsService = new AWSSesNotificationsFactory(defaultConfig);
            awsService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid configuration') === 0, err);
                done();
            });
        });

        it('"AWS_KEY" config field is required', function(done){
            defaultConfig.AWS_KEY = null;
            var awsService = new AWSSesNotificationsFactory(defaultConfig);
            awsService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid configuration') === 0, err);
                done();
            });
        });

        it('"AWS_SECRET" config field is required', function(done){
            defaultConfig.AWS_SECRET = null;
            var awsService = new AWSSesNotificationsFactory(defaultConfig);
            awsService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid configuration') === 0, err);
                done();
            });
        });

        // TODO: this is calling AWS. Need to mock with proxyquire or similar
        //it('all required fields should send', function(done){
        //    var awsService = new AWSSesNotificationsFactory(defaultConfig);
        //    awsService.send(message, function(err, data){
        //        assert.ifError(err);
        //        done();
        //    })
        //});

    });

    describe('message configuration', function(){
        it('"to" field is required', function(done){
            message.to = null;
            var awsService = new AWSSesNotificationsFactory(defaultConfig);
            awsService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid options') === 0, err);
                done();
            });
        });

        it('"title" field is required', function(done){
            message.title = null;
            var awsService = new AWSSesNotificationsFactory(defaultConfig);
            awsService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid options') === 0, err);
                done();
            });
        });

        it('"body" field is required', function(done){
            message.body = null;
            var awsService = new AWSSesNotificationsFactory(defaultConfig);
            awsService.send(message, function(err, data){
                assert.ok(err);
                assert.ok(err.indexOf('invalid options') === 0, err);
                done();
            });
        });

    });

});
