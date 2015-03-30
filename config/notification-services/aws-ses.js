module.exports = (function(){
    return {
        from: process.env.WATCHMEN_AWS_FROM,
        region: process.env.WATCHMEN_AWS_REGION,
        AWS_KEY: process.env.WATCHMEN_AWS_KEY,
        AWS_SECRET: process.env.WATCHMEN_AWS_SECRET
    };
})();