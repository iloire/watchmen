module.exports.notifications = {
	enabled: false, //if disabled, no email will be sent (just console messages)
	to: ['ivan@iloire.com'], //default notification list if no alert_to is specified for host or url
	postmark : {
		from: 'ivan@iloire.com',
		api_key : 'your-postmark-key-here'
	}
};
