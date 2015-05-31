exports = module.exports = (function () {

  function isServiceRestrictedToEmail(service, email) {
    if (!service) {
      return false;
    }
    var restrictedTo = service.restrictedTo;
    if (!email) {
      return !restrictedTo;
    }
    else {
      return !restrictedTo || restrictedTo.indexOf(email) > -1;
    }
  }

  return {

    filterServices: function (services, email) {
      var isArray = Array.isArray(services);

      if (!isArray) {
        services = [services];
      }
      services = services.filter(function(service){
        return isServiceRestrictedToEmail(service, email);
      });

      return isArray ? services : services[0];
    },

    filterReports: function (serviceReports, email) {
      var isArray = Array.isArray(serviceReports);

      if (!isArray) {
        serviceReports = [serviceReports];
      }

      serviceReports = serviceReports.filter(function (serviceReport) {
        return serviceReport && isServiceRestrictedToEmail(serviceReport.service, email);
      });

      return isArray ? serviceReports : serviceReports[0];
    }

  }

})();