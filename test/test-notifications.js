var assert = require ('assert');
var NotificationsFactory = new require('../lib/notifications/notifications');

describe('notifications', function(){

    var defaultNotificationsConfig;

    beforeEach(function(){
        defaultNotificationsConfig = {
            services: [
                {
                    enabled: false,
                    name: 'service 1',
                    path: '../../test/fixtures/notifications/services/service1/service',
                    config: '../../test/fixtures/notifications/services/service1/config'
                },
                {
                    enabled: true,
                    name: 'service 2',
                    path: '../../test/fixtures/notifications/services/service2/service',
                    config: '../../test/fixtures/notifications/services/service2/config'
                }
            ]
        };
    });

    describe('configuration', function(){
        it('should require services', function(done){
            defaultNotificationsConfig.services = null;
            var notifications_service = new NotificationsFactory(defaultNotificationsConfig);
            notifications_service.sendServiceBackAlert({}, function(err){
                assert.equal(err.indexOf('invalid configuration in NotificationService'), 0);
                done();
            });
        });
    });

    describe('getEnabledServices', function(){
        it('should fetch services enabled', function(done){
            var notifications_service = new NotificationsFactory(defaultNotificationsConfig);
            assert.equal(notifications_service.getEnabledServices().length, 1);

            defaultNotificationsConfig.services[0].enabled = true;
            assert.equal(notifications_service.getEnabledServices().length, 2);
            done();
        });

        it('should return valid services', function(done){
            var notifications_service = new NotificationsFactory(defaultNotificationsConfig);
            var services = notifications_service.getEnabledServices();
            assert.equal(typeof services[0].send, 'function');
            assert.equal(services[0].getName(), 'service 2');
            done();
        });
    });

    describe('send', function(){
        // TODO need to spy the send function to make sure it gets called with extra
        // emails provided by config.alwaysAlertTo
        // using proxyquire or similar
        it('should take into account config.alwaysAlertTo', function(done){
            var notifications_service = new NotificationsFactory(defaultNotificationsConfig);
            //notifications_service.send();
            done();
        });
    });
});
