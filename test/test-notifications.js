var assert = require('assert');
var NotificationsFactory = new require('../lib/notifications/notifications');

describe('notifications', function () {

  var defaultNotificationsConfig;

  beforeEach(function () {
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

  describe('configuration', function () {
    it('should get default config if none provided', function (done) {
      var notificationsService = new NotificationsFactory();
      assert.equal(notificationsService.config.services.length, 2);
      done();
    });

    it('should require services', function (done) {
      defaultNotificationsConfig.services = null;
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      notificationsService.sendServiceBackAlert({}, {}, function (err) {
        assert.equal(err.indexOf('invalid configuration in NotificationService'), 0);
        done();
      });
    });
  });

  describe('getEnabledServices', function () {
    it('should fetch services enabled', function (done) {
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      assert.equal(notificationsService.getEnabledServices().length, 1);

      defaultNotificationsConfig.services[0].enabled = true;
      assert.equal(notificationsService.getEnabledServices().length, 2);
      done();
    });

    it('should return valid services', function (done) {
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      var notificationServices = notificationsService.getEnabledServices();
      assert.equal(typeof notificationServices[0]._send, 'function');
      assert.equal(notificationServices[0].getName(), 'service 2');
      done();
    });
  });

  describe('sendServiceDownAlert', function () {
    it('should call _send with the right parameters', function (done) {
      var mockServiceConfig = {
        name: 'url info', // hardcoded. this value is actually calculated while loading the services
        alert_to: ['email1@domain.com', 'email2@domain.com']
      };

      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      notificationsService._send = function (service, cb) {
        assert.equal(service.to[0], 'email1@domain.com');
        assert.equal(service.title, '[watchmen] url info is down!');
        assert.ok(service.body.indexOf('url info is down') === 0, service.body);
        cb();
      };
      notificationsService.sendServiceDownAlert(mockServiceConfig, {error: "ERROR"}, done);
    });
  });

  describe('sendServiceBackAlert', function () {
    var mockServiceConfig;

    beforeEach(function () {
      mockServiceConfig = {
        name: 'url info', // hardcoded. this value is actually calculated while loading the services
        alert_to: ['email1@domain.com', 'email2@domain.com'],
        msg: 'is back '
      };
    });

    it('should call _send with the right parameters', function (done) {
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      notificationsService._send = function (service, cb) {
        assert.equal(service.to.length, 2);
        assert.equal(service.to[0], 'email1@domain.com');
        assert.equal(service.title, '[watchmen] url info is back!');
        assert.ok(service.body.indexOf('url info is back') === 0, service.body);
        cb();
      };
      notificationsService.sendServiceBackAlert(mockServiceConfig, {}, done);
    });

    it('should call take into account config.alwaysAlertTo', function (done) {
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      defaultNotificationsConfig.alwaysAlertTo = 'admin@domain.com, admin2@domain.com';
      notificationsService._send = function (service, cb) {
        assert.equal(service.to.length, 4);
        assert.equal(service.to[3], 'admin2@domain.com');
        cb();
      };
      notificationsService.sendServiceBackAlert(mockServiceConfig, {}, done);
    });
  });

  describe('send', function () {
    it('TODO', function (done) {
      done();
    });
  });
});
