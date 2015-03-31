var assert = require ('assert');
var NotificationsFactory = new require('../lib/notifications/notifications');

describe('notifications', function(){

    var defaultConfig;

    beforeEach(function(){
        defaultConfig = {
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
            defaultConfig.services = null;
            var notifications_service = new NotificationsFactory(defaultConfig);
            notifications_service.send({}, function(err, data){
                assert.ok(err);
                done();
            });
        });
    });

    describe('getEnabledServices', function(){
        it('should fetch services enabled', function(done){
            var notifications_service = new NotificationsFactory(defaultConfig);
            assert.equal(notifications_service.getEnabledServices().length, 1);

            defaultConfig.services[0].enabled = true;
            assert.equal(notifications_service.getEnabledServices().length, 2);
            done();
        });

        it('should return valid services', function(done){
            var notifications_service = new NotificationsFactory(defaultConfig);
            var services = notifications_service.getEnabledServices();
            assert.equal(typeof services[0].send, 'function');
            assert.equal(services[0].getName(), 'service 2');
            done();
        });

    });

});
