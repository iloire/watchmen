Handlebars.registerHelper('dateFormat', function(context, block) {
  if (!context) return '';

  if (window.moment) {
    if (block.hash.ago){
      return moment(context).fromNow();
    }
    else{
      var f = block.hash.format || "MMM Do, YYYY";
      if (moment(context) > moment().subtract('days', 1)){
        f = "HH:mm";
      }
      return moment(context).format(f);
    }

  }else{
    return context;   //  moment plugin not available. return data as is.
  }
});


Handlebars.registerHelper('ifvalue', function (conditional, options) {
  if (options.hash.value === conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});