exports = module.exports = (function(){

  return {

    shouldReturnStatusCode: function (agent, options, done) {
      agent
          .get(options.url)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(options.statusCode)
          .send()
          .end(function (err) {
            done(err);
          });
    },

    shouldDenyPostingTo: function(agent, url, done) {
      agent
          .post(url)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(401)
          .send()
          .end(function (err) {
            done(err);
          });
    }
  };

})();