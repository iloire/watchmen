var interval = 2500; //ms
var _data = null;
var _timer = null;

var watchmen_client = {

  currentSort : [],

  bind : function (data, filter){
    var self = this;
    var display_data = {};

    if (filter){
      //ECMA 5 filter
      display_data.services = data.services.filter(function(item){
        return item.url_info.indexOf(filter)>-1;
      });
    }
    else{
      display_data = data;
    }

    //------------------------------------------
    // List of all services
    //------------------------------------------
    var template_list = Handlebars.compile($("#services_list_template").html());
    $('#data_holder').html(template_list(display_data));

    //------------------------------------------
    // Counters
    //------------------------------------------
    var overviewTemplate = Handlebars.compile($("#status-overview-template").html());
    var overviewData = {};

    function down(service){
      return (service.data && service.data.status === "error");
    }

    overviewData.down = display_data.services.filter(down).length;

    $('#status-overview').html(overviewTemplate(overviewData));

    //------------------------------------------
    // Config table sorter, remember sort options
    //------------------------------------------
    if (display_data.services.length){
      var localStorageKey = "servicesSortList";
      if (window.localStorage){
        if (window.localStorage.getItem(localStorageKey)){
          self.currentSort = JSON.parse(window.localStorage.getItem(localStorageKey));
        }
      }
      //debugger;
      $("table.sorted").tablesorter({
        headers: {8: {sorter: 'percent'}, 9: {sorter: false}},
        sortList: self.currentSort
      }).bind("sortEnd", function(sorter) {
        self.currentSort = sorter.target.config.sortList;
        if (window.localStorage){
          window.localStorage.setItem(localStorageKey, JSON.stringify(self.currentSort));
        }
      });
    }

    self.resetTimer();
  },

  resetTimer : function(){
    var self = this;
    clearTimeout(_timer);
    _timer = setTimeout (function(){self.refresh.call(self);}, interval);
  },

  refresh : function (){
    var self = this;
    $.ajax({ url: '/getdata', data: {}, dataType: 'json', success: function (data) {
      _data = data;
      self.bind(data, $('#filter').val());

      //------------------------------------------
      // Next tick
      //------------------------------------------
      self.resetTimer();
      }
    });
  }
};