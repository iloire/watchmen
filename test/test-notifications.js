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
      var mockServiceConfig = {
        name: 'url info',
        alertTo: 'email1@domain.com, email2@domain.com'
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      notificationsService.sendServiceBackAlert(mockServiceConfig, {}, function (err) {
        assert.equal(err.indexOf('invalid configuration in NotificationService'), 0, err);
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
      assert.equal(typeof notificationServices[0].send, 'function');
      assert.equal(notificationServices[0].getName(), 'service 2');
      done();
    });
  });

  describe('sendServiceDownAlert', function () {
    it('should not call _send if there are not recipients', function (done) {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: ''
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      notificationsService._send = function () {
        assert.fail('should not be called');
      };
      notificationsService.sendServiceDownAlert(mockServiceConfig, {error: "ERROR"}, function(err){
        assert.ifError(err);
        done();
      });
    });

    it('should call _send with the right parameters', function (done) {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: 'email1@domain.com, email2@domain.com'
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
        name: 'url info',
        alertTo: 'email1@domain.com, email2@domain.com',
        msg: 'is back '
      };
    });

    it('should not call _send if there are not recipients', function (done) {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: ''
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      notificationsService._send = function () {
        assert.fail('should not be called');
      };
      notificationsService.sendServiceBackAlert(mockServiceConfig, {error: "ERROR"}, function(err){
        assert.ifError(err);
        done();
      });
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

  describe('_getRecipients', function () {
    it('should concat with default list of emails', function () {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: 'email1@domain.com'
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      var emailListResult = notificationsService._getRecipients(mockServiceConfig, ['email2@domain.com']);
      assert.equal (emailListResult.length, 2);
    });

    it('should avoid duplicates', function () {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: 'email1@domain.com'
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      var emailListResult = notificationsService._getRecipients(mockServiceConfig, ['email1@domain.com']);
      assert.equal (emailListResult.length, 1);
    });

    it('should not include empty values from alertTo', function () {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: ''
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      var emailListResult = notificationsService._getRecipients(mockServiceConfig, ['email1@domain.com']);
      assert.equal (emailListResult.length, 1);
    });

    it('should not include empty values from additional list of emails', function () {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: 'email1@domain.com'
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      var emailListResult = notificationsService._getRecipients(mockServiceConfig, ['']);
      assert.equal (emailListResult.length, 1);
    });

    it('should trim emails', function () {
      var mockServiceConfig = {
        name: 'url info',
        alertTo: '  email1@domain.com  '
      };
      var notificationsService = new NotificationsFactory(defaultNotificationsConfig);
      var emailListResult = notificationsService._getRecipients(mockServiceConfig, ['  email2@domain.com   ']);
      assert.equal (emailListResult[0], 'email1@domain.com');
      assert.equal (emailListResult[1], 'email2@domain.com');
    });

  });
});
