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

  development2: {
    provider : 'redis',
    options : {
      'redis' : {
        port: 1216,
        host: '127.0.0.1',
        db: 3
      }
    }
  }

};