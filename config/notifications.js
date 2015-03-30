exports = module.exports = (function(){

    /**
     * Notification services.
     * Enable the ones you want to use :)
     */

    return  {
        enabled: true,
        to: ['your-email@domain.com'], //default notification list if no alert_to is specified for host or url
        services: [
            {
                enabled: process.env.WATCHMEN_NOTIFICATIONS_AWS_SES_ENABLED,
                name : 'aws-ses',
                path: './aws-ses/aws-ses',
                config: '../../config/notification-services/aws-ses'
            },
            {
                enabled: process.env.WATCHMEN_NOTIFICATIONS_POSTMARK_ENABLED,
                name : 'aws-ses',
                path: './postmark/postmark',
                config: '../../config/notification-services/postmark'
            }
        ],
        logTo: process.env.WATCHMEN_NOTIFICATIONS_LOG_TO // log notification events into a file
    }
})();