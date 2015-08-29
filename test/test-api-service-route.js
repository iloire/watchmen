var request = require('supertest');
var assert = require('assert');
var express = require('express');
var passport = require('passport');
var mockPassport = require('passport-mock');
var storageFactory = require('../lib/storage/storage-factory');
var superAgentAssertions = require('./lib/util/super-agent-assertions');

var storage = storageFactory.getStorageInstance('test');
var app = require('../webserver/app')(storage);

describe('service route', function () {

  var server;
  var PORT = 3355;

  var USERS = [
    {id: 1, email: 'admin@domain.com', isAdmin: true},
    {id: 2, email: 'user@domain.com', isAdmin: false}
  ];

  var API_ROOT = '/api';

  var agent = request.agent(app);
  var validService;

  before(function (done) {

    app.use(passport.initialize());
    app.use(passport.session());

    var mock = mockPassport(passport, USERS);
    mock(app);

    server = app.listen(PORT, function () {
      if (server.address()) {
        done();
      } else {
        console.log('something went wrong... couldn\'t listen to that port.');
        process.exit(1);
      }
    });
  });

  after(function () {
    server.close();
  });

  beforeEach(function () {
    validService = {
      name: 'my new service',
      pingServiceName: 'http-head',
      url: 'http://apple.com',
      timeout: 10000,
      port: 80,
      interval: 60000,
      failureInterval: 30000,
      warningThreshold: 30000
    };
  });

  describe('adding a service', function () {

    describe('with an anonymous user', function () {

      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should require auth', function (done) {
        superAgentAssertions.shouldDenyPostingTo(agent, API_ROOT + '/services', done);
      });
    });

    describe('with an authenticated normal user', function () {
      before(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should not have permissions', function (done) {
        superAgentAssertions.shouldDenyPostingTo(agent, API_ROOT + '/services', done);
      });
    });

    describe('with an authenticated admin user', function () {
      before(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should return 400 if the service does not validate', function (done) {
        var body = {
          name: 'my new service',
          interval: 1000
        };
        agent
            .post(API_ROOT + '/services')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .send(body)
            .end(function (err) {
              done(err);
            });
      });

      it('should add the service if properties are correct', function (done) {
        agent
            .post(API_ROOT + '/services')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .send(validService)
            .end(function (err, res) {
              if (err) {
                assert.ok(res.body.id);
                return done(err);
              }
              done();
            });
      });
    });
  });

  describe('updating a service', function () {

    describe('with an anonymous user', function () {

      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should require auth', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          superAgentAssertions.shouldDenyPostingTo(agent, API_ROOT + '/services/' + id, done);
        });
      });
    });

    describe('with an authenticated normal user', function () {
      before(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should not have permissions', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          superAgentAssertions.shouldDenyPostingTo(agent, API_ROOT + '/services/' + id, done);
        });
      });
    });

    describe('with an authenticated admin user', function () {
      before(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should return 400 if the service does not validate', function (done) {
        delete validService.interval;
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .post(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(400)
              .send(validService)
              .end(function (err) {
                done(err);
              });
        });
      });

      it('should update the service if properties are correct', function (done) {
        validService.name = "updated name";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .post(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send(validService)
              .end(function (err, res) {
                if (err) {
                  return done(err);
                }
                assert.equal(res.body.name, "updated name");
                done();
              });
        });
      });
    });
  });

  describe('deleting a service', function () {

    describe('with an anonymous user', function () {

      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should require auth', function (done) {
        agent
            .delete(API_ROOT + '/services/222')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401)
            .send()
            .end(function (err, res) {
              done(err);
            });
      });
    });

    describe('with an authenticated admin user', function () {

      before(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should return 404 if service is not found', function (done) {
        agent
            .delete(API_ROOT + '/services/222')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .send()
            .end(function (err) {
              done(err);
            });
      });

      it('should delete the service', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .delete(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                if (err) {
                  return done(err);
                }

                assert.equal(res.body.id, id);

                storage.getService(id, function (err, service) {
                  assert.ifError(err);
                  assert.equal(service, null);
                  done();
                });
              });
        });
      });

    });

    describe('with an authenticated normal user', function () {

      before(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should not have permissions', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .delete(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(401)
              .send()
              .end(function (err) {
                done(err);
              });
        });
      });
    });
  });

  describe('resetting a service', function () {

    describe('with an anonymous user', function () {

      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should require auth', function (done) {
        superAgentAssertions.shouldDenyPostingTo(agent, API_ROOT + '/services/222/reset', done);
      });
    });

    describe('with an authenticated normal user', function () {

      before(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should not have permissions', function (done) {
        superAgentAssertions.shouldDenyPostingTo(agent, API_ROOT + '/services/222/reset', done);
      });
    });

    describe('with an authenticated admin user', function () {

      before(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should return 404 if service is not found', function (done) {
        agent
            .post(API_ROOT + '/services/222/reset')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .send()
            .end(function (err) {
              done(err);
            });
      });

      it('should reset the service', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .post(API_ROOT + '/services/' + id + '/reset')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.id, id);
                done(err);
                // TODO: add a ping to the service, then make sure reset has deleted all ping data.
              });
        });
      });
    });
  });

  describe('loading a service', function () {

    describe('with an anonymous user', function () {
      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should require auth', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          superAgentAssertions.shouldReturnStatusCode(agent, {
            url : API_ROOT + '/services/' + id,
            statusCode: 401
          }, done);
        });
      });

    });

    describe('with an authenticated normal user', function () {
      before(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should have not access if restrictions are applied but user is not included', function (done) {
        validService.restrictedTo = "other@domain.com";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          superAgentAssertions.shouldReturnStatusCode(agent, {
            url : API_ROOT + '/services/' + id,
            statusCode: 401
          }, done);
        });
      });

    });

    describe('with an authenticated admin user', function () {
      before(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should load the service', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.name, validService.name);
                assert.equal(res.body.interval, validService.interval);
                assert.equal(res.body.pingServiceName, validService.pingServiceName);
                assert.equal(res.body.url, validService.url);
                assert.equal(res.body.timeout, validService.timeout);
                assert.equal(res.body.port, validService.port);
                assert.equal(res.body.failureInterval, validService.failureInterval);
                assert.equal(res.body.warningThreshold, validService.warningThreshold);
                done(err);
              });
        });
      });

      it('should load the service even if it is restricted to another user', function (done) {
        validService.restrictedTo = 'other@domain.com';
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.name, validService.name);
                done(err);
              });
        });
      });
      it('should return 404 if the service does not exist', function (done) {
        superAgentAssertions.shouldReturnStatusCode(agent, {
          url : API_ROOT + '/services/222222',
          statusCode: 404
        }, done);
      });

    });
  });

  describe('loading all services', function () {

    describe('with an anonymous user', function () {
      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should require auth', function (done) {
        storage.flush_database(function () {
          storage.addService(validService, function (err, id) {
            assert.ifError(err);
            superAgentAssertions.shouldReturnStatusCode(agent, {
              url : API_ROOT + '/services',
              statusCode: 401
            }, done);
          });
        });
      });
    });

    describe('with an authenticated normal user', function () {
      before(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should require auth', function (done) {
        storage.flush_database(function () {
          storage.addService(validService, function (err, id) {
            assert.ifError(err);
            superAgentAssertions.shouldReturnStatusCode(agent, {
              url : API_ROOT + '/services',
              statusCode: 401
            }, done);
          });
        });
      });

    });

    describe('with an authenticated admin user', function () {
      before(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should load services', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services/')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.filter(function(s){ return s.id === id; }).length, 1);
                done(err);
              });
        });
      });

    });

  });

});
