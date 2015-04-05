var one_tick = 60; //seconds

// This will be soon moved to a database
// https://github.com/iloire/WatchMen/issues/23

// service name must be unique for a certain host.
// host name must be unique
module.exports =
  [
    {
      name:'apple HTTPS',
      host: 'www.apple.com',
      port:443,
      protocol: 'https',
      ping_service_name: 'http',
      timeout:10000,
      ping_interval: one_tick, //seconds
      failed_ping_interval: one_tick / 3, //seconds
      enabled: true,
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Apple Inc'}
        }
      ]
    } ,
    {
      name:'yahoo',
      host: 'www.yahoo.com',
      port:80,
      //protocol: 'http', // default is http
      //ping_service_name: 'http', // default is http
      //timeout:10000,  // default is 10 seconds
      ping_interval: one_tick, //seconds
      //failed_ping_interval: one_tick / 3, //default is 1/3 of ping_interval
      //enabled: true, //default is true
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 301}
        }
      ]
    } ,
    {
      name:'facebook',
      host: 'www.facebook.com',
      port:80,
      ping_interval: one_tick, //seconds
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 302}
        }
      ]
    } ,
    {
      name:'twitter',
      host: 'www.twitter.com',
      port:80,
      ping_interval: one_tick, //seconds
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 301}
        }
      ]
    } ,
    {
      name:'youtube',
      host: 'www.youtube.com',
      port:80,
      ping_interval: one_tick, //seconds
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 301}
        }
      ]
    } ,
    {
      name:'medium',
      host: 'www.medium.com',
      port:80,
      ping_interval: one_tick, //seconds
      // alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 301}
        }
      ]
    } ,
    {
      name:'bitbucket',
      host: 'www.bitbucket.com',
      port:80,
      ping_interval: one_tick, //seconds
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 302}
        }
      ]
    } ,
    {
      name:'github',
      host: 'www.github.com',
      port:80,
      ping_interval: one_tick, //seconds
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Github'}
        }
      ]
    } ,
    {
      name:'microsoft',
      host: 'www.microsoft.com',
      port:80,
      ping_interval: one_tick, //seconds
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Microsoft'}
        }
      ]
    } ,
    {
      name:'vitaminas dev',
      host: 'www.vitaminasdev.com',
      port:80,
      ping_interval: one_tick, //seconds
      //alert_to: ['your-email@domain.com'],
      warning_if_takes_more_than: 1500, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'noticias'}
        },
        {
          name: 'contact page',
          method: 'get',
          url : '/Home/Contacto',
          expected: {statuscode: 200, contains: 'encantados'},
          ping_interval:200, //overwrite ping and retry intervals for this url
          failed_ping_interval: one_tick / 3
        }
      ],
      restrictedTo: [ "myemail@domain.com" ]
    } ,
    {
      name:'ASP Photo Gallery',
      host: 'www.aspphotogallery.net',
      port:80,
      ping_interval: one_tick,
      warning_if_takes_more_than: 1300, //miliseconds
      alert_to: ['ajax@aspphotogallery.net'], //you can include a different email recipient per host
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: { statuscode: 200 , contains: 'dGallery'}
        }
      ],
      restrictedTo: [ "myemail@domain.com" ]
    } ,
    {
      name:'cachiruloValley',
      host: 'cachirulovalley.com',
      port:80,
      ping_interval: one_tick,
      warning_if_takes_more_than: 3000, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: ''}
        }
      ],
      restrictedTo: [ "myemail@domain.com" ]
    } ,
    {
      name:'directorio cachirulo valley',
      host: 'directorio.cachirulovalley.com',
      port:80,
      ping_interval: 3 * one_tick,
      warning_if_takes_more_than: 3000, //miliseconds
      services : [
        {
          name: 'home',
          method: 'get',
          //alert_to: ['email@domain.com'], //alert at service level
          url : '/',
          expected: {statuscode: 200, contains: ''}
        } ,
        {
          name: 'directory',
          method: 'get',
          url : '/directory',
          //alert_to: ['other.email@domain.com'], //alert at service level
          expected: {statuscode: 200, contains: ''}
        }
      ],
      restrictedTo: [ "myemail@domain.com" ]
    } ,
    {
      name:'letsnode.com',
      host: 'letsnode.com',
      port:80,
      ping_interval: one_tick,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200}
        }
      ]
    } ,
    {
      name:'mathrace demo',
      host: 'letsnode.com',
      port:8090,
      ping_interval: one_tick,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Race'}
        }
      ]
    } ,
    {
      name:'google.com',
      host: 'www.google.com',
      port:80,
      ping_interval: one_tick,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 302, contains: ''}
        }
      ]
    } ,
    {
      name:'localhost test',
      host: '127.0.0.1',
      port:8080,
      ping_interval: one_tick,
      //alert_to: ['your-email@domain.com'],
      enabled: false,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: ''}
        }
      ]
    } ,
    {
      name:'amazon',
      host: 'www.amazon.com',
      port:80,
      ping_interval: one_tick,
      warning_if_takes_more_than: 2000, //miliseconds
      //alert_to:['your-email@domain.com'],
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Amazon'}
        }
      ]
    } ,
    {
      name:'wordpress',
      host: 'www.wordpress.com',
      port:80,
      ping_interval: one_tick,
      warning_if_takes_more_than: 2000, //miliseconds
      //alert_to:['your-email@domain.com'],
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 301}
        }
      ]
    } ,
    {
      name:'hacker news',
      host: 'news.ycombinator.com',
      port:80,
      ping_interval: one_tick,
      warning_if_takes_more_than: 4000, //miliseconds
      //alert_to:['your-email@domain.com'],
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: { statuscode: 301 }
        }
      ]
    } ,
    {
      name:'form post test',
      host: 'hroch486.icpf.cas.cz',
      port:80,
      ping_interval: one_tick,
      services : [
        {
          name: 'post',
          method: 'get',
          url : '/formpost.html',
          expected: {statuscode: 200, contains: 'Test Form -- POST method'}
        },
        {
          name: 'post with data',
          method: 'post',
          input_data : 'your_name=Ivan&fruit=Banana',
          content_type : 'application/x-www-form-urlencoded', // application/json
          url : '/cgi-bin/echo.pl',
          expected: {statuscode: 200, contains: 'your_name = Ivan'}
        }
      ]
    } ,
    {
      name:'node js',
      host: 'nodejs.org',
      port:80,
      timeout:10000,
      ping_interval: one_tick,
      warning_if_takes_more_than: 1500,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Node'}
        }
      ]
    } ,
    {
      name:'redis',
      host: 'redis.io',
      port:80,
      ping_interval: one_tick,
      warning_if_takes_more_than: 1500,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200, contains: 'Redis'}
        }
      ]
    } ,
    {
      name:'express',
      host: 'expressjs.com',
      port:80,
      ping_interval: one_tick,
      services : [
        {
          name: 'home',
          method: 'get',
          url : '/',
          expected: {statuscode: 200}
        }
      ]
    }
  ];