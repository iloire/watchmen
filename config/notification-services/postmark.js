module.exports = (function(){
    return {
        from: process.env.WATCHMEN_POSTMARK_FROM,
        API_KEY: process.env.WATCHMEN_POSTMARK_API_KEY
    };
})();