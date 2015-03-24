module.exports = {

  public_host_name: 'http://watchmen.letsnode.com/', // required for OAuth dance

  auth: {
    GOOGLE_CLIENT_ID: process.env.WATCHMEN_GOOGLE_CLIENT_ID || '<Create credentials from Google Dev Console>',
    GOOGLE_CLIENT_SECRET: process.env.WATCHMEN_GOOGLE_CLIENT_SECRET || '<Create credentials from Google Dev Console>'
  },

  'notifications' : {
    enabled: false, //if disabled, no notifications will be sent
    to: ['your-email@domain.com'], //default notification list if no alert_to is specified for host or url
    postmark : {
      from: 'your-email@domain.com',
      api_key : 'your-postmark-key-here'
    }
  },

  remove_events_older_than_seconds : 60 * 60 * 24 * 10, // 10 days default configuration
};
