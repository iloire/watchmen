exports = module.exports = {

  production: {
    provider : 'redis',
    options : {
      'redis' : {
        port: 1216,
        host: '127.0.0.1',
        db: 1
      }
    }
  },

  development: {
    provider : 'redis',
    options : {
      'redis' : {
        port: 1216,
        host: '127.0.0.1',
        db: 2
      }
    }
  },

  test: {
    provider : 'redis',
    options : {
      'redis' : {
        port: 6666,
        host: '127.0.0.1',
        db: 5
      }
    }
  }

};