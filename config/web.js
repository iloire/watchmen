module.exports = {

    public_host_name: 'http://watchmen.letsnode.com/', // required for OAuth dance

    auth: {
        GOOGLE_CLIENT_ID: process.env.WATCHMEN_GOOGLE_CLIENT_ID || '<Create credentials from Google Dev Console>',
        GOOGLE_CLIENT_SECRET: process.env.WATCHMEN_GOOGLE_CLIENT_SECRET || '<Create credentials from Google Dev Console>'
    },

    ga_analytics_ID: process.env.WATCHMEN_GOOGLE_ANALYTICS_ID
};
