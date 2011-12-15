/*
	ping_interval (host or url level): 
	- ping interval, in seconds.
	
	failed_ping_interval (host or url level): 
	- when site is down, ping interval, in seconds, until site is backup again

*/
var one_minute = 10 //you can set this to other value for testing the service in dev env.

exports.hosts = 
	[
		{
			name:'VitaminasDev', 
			host: 'www.vitaminasdev.com', 
			port:80,
			ping_interval: one_minute, //seconds
			failed_ping_interval: one_minute, //minutes
			enabled: true,
			alert_to: ['ivan@iloire.com'], 
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'noticias'} ,
				},
				{
					method: 'get', 
					url : '/Home/Contacto', 
					expected: {statuscode: 200, contains: 'encantados'},
					ping_interval:200, //overwrite ping and retry intervals for this url
					failed_ping_interval: one_minute/2
				}
			]
		}
		,	
		{
			name:'iloire.com', 
			host: 'www.iloire.com', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'vitaminas'} 
				},
				{
					method: 'get', 
					url : '/en', 
					expected: {statuscode: 200, contains: 'Freelance'} 
				},
			]
		}
		,
		{
			name:'ASP Photo Gallery', 
			host: 'www.aspphotogallery.net', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			alert_to: ['ajax@aspphotogallery.net'], //you can include a different email recipient per host
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'fast and responsive'}
				},
				{
					method: 'get', 
					url : '/mvcphotogallery', 
					expected: {statuscode: 200, contains: 'Knockout'}
				},
				{
					method: 'get',
					enabled: false,
					url : '/demomvc', 
					expected: {statuscode: 200, contains: 'Simple, sexy, FAST, ASP.NET MVC photo gallery'}
				}
			]
		}
		,
		{
			name:'CachiruloValley', 
			host: 'cachirulovalley.com', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: ''}
				}
			]
		}
		,
		{
			name:'SocialMadrid', 
			host: 'socialmadrid11.com', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 302, contains: ''}
				}
			]
		}
		,
		{
			name:'letsnode.com', 
			host: 'letsnode.com', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'A blog about node.js and express.js'}
				}
			]
		}
		,
		{
			name:'letsnode.com frelancer service', 
			host: 'letsnode.com', 
			port:8080, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'journey'}
				}
			]
		}
		,
		{
			name:'letsnode.com directory web', 
			host: 'letsnode.com', 
			port:8081, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'directory'}
				}
			]
		}
		,
		{
			name:'google.com', 
			host: 'www.google.com', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 302, contains: ''}
				}
			]
		}
		,
		{
			name:'localhost_test', 
			host: '127.0.0.1', 
			port:8080, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			alert_to: ['ivan@iloire.com','iloire@gmail.com'],
			enabled: true,
			urls : [
				{
					method: 'get', 
					url : '/', 
					expected: {statuscode: 200, contains: 'blog about node'}
				}
			]
		}
		,
		{
			name:'Idibay', 
			host: 'direct.idibay.com', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			alert_to:['ivan@iloire.com'],
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Mundo Idibay'}
				}
			]
		}
		,
		{
			name:'Cuéntica', 
			host: 'www.cuentica.com', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: true,
			alert_to:['ivan@iloire.com'],
			urls : [
				{
					method: 'get',
					url : '/', 
					expected: {statuscode: 200, contains: 'Cuéntica'}
				}
			]
		}
		,
		{
			name:'form post test', 
			host: 'hroch486.icpf.cas.cz', 
			port:80, 
			ping_interval: one_minute,
			failed_ping_interval: one_minute,
			enabled: false,
			urls : [
				{
					method: 'get',
					url : '/formpost.html', 
					expected: {statuscode: 200, contains: 'Test Form -- POST method'}
				},
				{
					method: 'post',
					input_data : 'your_name=Ivan&fruit=Banana', 
					content_type : 'application/x-www-form-urlencoded', // application/json
					url : '/cgi-bin/echo.pl', 
					expected: {statuscode: 200, contains: 'your_name = Ivan'}
				}
			]
		}
		
	]

exports.logging = {
	Enabled : true,
	base_path : './logs/' //use last "/". Make sure this directory exists
}

exports.notifications = {
	Enabled: true, //if disabled, no email will be sent (just console messages)
	To: ['ivan@iloire.com'], //default notification list if no alert_to is specified for host or url
	postmark : {
		From: 'ivan@iloire.com',
		Api_key : 'your-postmark-key-here'
	}
} 
