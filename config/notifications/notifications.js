exports = module.exports = (function(){

    /**
     * Notification services.
     * Enable the ones you want to use :)
     *
     * How to create a new notification service:
     * - 1) Create a new service entry in this file
     * - 2) Create the actual service file in 'path'
     * - 3) Setup some default configuration file in 'config'
     */

    return  {
        enabled: true,
        to: ['your-email@domain.com'],
        services: [
            {
                enabled: process.env.WATCHMEN_NOTIFICATIONS_AWS_SES_ENABLED,
                name : 'aws-ses',
                path: './services/aws-ses/aws-ses',
                config: '../../config/notifications/services/aws-ses'
            },
            {
                enabled: process.env.WATCHMEN_NOTIFICATIONS_POSTMARK_ENABLED,
                name : 'aws-ses',
                path: './services/postmark/postmark',
                config: '../../config/notifications/services/postmark'
            }
        ],
        logTo: process.env.WATCHMEN_NOTIFICATIONS_LOG_TO // log notification events into a file
    }
})();