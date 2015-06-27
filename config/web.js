module.exports = {

    public_host_name: process.env.WATCHMEN_BASE_URL, // required for OAuth dance

    auth: {
        GOOGLE_CLIENT_ID: process.env.WATCHMEN_GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.WATCHMEN_GOOGLE_CLIENT_SECRET
    },

    port: process.env.WATCHMEN_WEB_PORT, // default port

    admins: process.env.WATCHMEN_ADMINS,

    ga_analytics_ID: process.env.WATCHMEN_GOOGLE_ANALYTICS_ID,

    baseUrl: '/'
};
