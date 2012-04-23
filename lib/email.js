var postmark = require ('./postmark')

exports.sendEmail = function (to_list, subject, body, callback){
	postmark.sendEmail(
	{
		'From' : config.notifications.postmark.From,
		'To': to_list.join(','),
		'Subject': subject,
		'TextBody': body }, config.notifications.postmark.Api_key, function(err, data) {

		if (err) {
			console.error (err);
			callback (err, null);
		} else {
			callback (null,'Email sent successfully to ' + to_list.join(','))
		}
	})
}
