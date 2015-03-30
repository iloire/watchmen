var assert = require ('assert');
var NotificationsFactory = new require('../lib/notifications/notifications');

describe('notifications', function(){

    var defaultConfig;

    before(function(){
        defaultConfig = {
            services: [
                {
                    enabled: false,
                    name: 'my service',
                    config: 'config path',
                    path: 'service path'
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

        it('should ignore disabled services', function(done){
            defaultConfig.services = [
                {
                    enabled: false,
                    name: 'service 1',
                    path: '../../test/fixtures/notifications/service1/service',
                    config: '../../test/fixtures/notifications/service1/config'
                },
                {
                    enabled: true,
                    name: 'service 2',
                    path: '../../test/fixtures/notifications/service2/service',
                    config: '../../test/fixtures/notifications/service2/config'
                }
            ];
            var notifications_service = new NotificationsFactory(defaultConfig);
            notifications_service.send({}, function(err, data){
                assert.ifError(err);
                assert.equal(data.length, 1);
                done();
            });
        });

    });

});
