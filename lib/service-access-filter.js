exports = module.exports = (function () {

  function isServiceRestrictedToEmail(service, email) {
    if (!service) {
      return false;
    }
    var restrictedTo = (service.restrictedTo || '').split(',')
        .map(function(s){ return s.trim(); })
        .filter(function(s){ return s; });

    if (!email) {
      return restrictedTo.length; // no email provided. restricted access if restrictions are enabled
    }
    else {
      return restrictedTo.length > 0 && restrictedTo.indexOf(email) === -1;
    }
  }

  return {

    /**
     * Filter allowed services for a particular user
     * @param services
     * @param user
     * @returns {Array}
     */

    filterServices: function (services, user) {
      user = user || {};
      var isArray = Array.isArray(services);

      if (!isArray) {
        services = [services];
      }
      services = services.filter(function(service){
        return user.isAdmin || !isServiceRestrictedToEmail(service, user.email);
      });

      return isArray ? services : services[0];
    },

    /**
     * Filter allowed service reports for a particular user
     * @param serviceReports
     * @param user
     * @returns {Array}
     */

    filterReports: function (serviceReports, user) {
      user = user || {};
      if (!serviceReports) {
        return serviceReports;
      }
      var isArray = Array.isArray(serviceReports);

      if (!isArray) {
        serviceReports = [serviceReports];
      }

      serviceReports = serviceReports.filter(function (serviceReport) {
        return user.isAdmin || !isServiceRestrictedToEmail(serviceReport.service, user.email);
      });

      return isArray ? serviceReports : serviceReports[0];
    },

    // exposed for testing
    _isServiceRestrictedToEmail: isServiceRestrictedToEmail

  };

})();