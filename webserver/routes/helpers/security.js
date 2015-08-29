var crypto = require('crypto');

exports = module.exports = (function () {

  function md5(str) {
    var hash = crypto.createHash('md5');
    hash.update(str.toLowerCase().trim());
    return hash.digest('hex');
  }

  function isAdmin(email) {
    var admins = (process.env.WATCHMEN_ADMINS || '').split(',').map(function (email) {
      return email.trim();
    });
    return admins.indexOf(email) > -1;
  }

  return {
    md5: md5,
    isAdmin: isAdmin
  }

})();