var viewModel = {
	urls: ko.observableArray(),
	lastupdate: ko.observable(),
	filter: ko.observable(''),
};

viewModel.filteredUrls = ko.dependentObservable(function() {
	var filter = this.filter().toLowerCase();

	if(!filter) {
		return this.urls();
	} else {
		return ko.utils.arrayFilter(this.urls(), function(item) {
		if(item.host.name.toLowerCase().search(filter) != -1) {
			return true;
		}
		});
	}
}, viewModel);

viewModel.hostsUp = ko.dependentObservable(function() {
	return ko.utils.arrayFilter(this.filteredUrls(), function(item) {
	    if(item.status == 'ok')
	        return true;
	}).length;

}, viewModel);

viewModel.hostsDown = ko.dependentObservable(function() {
	return ko.utils.arrayFilter(this.filteredUrls(), function(item) {
	    if(item.status == 'error') 
	        return true;
	}).length;

}, viewModel);

var interval=1500; //ms

function round (val){
	if (val<10)
		val = '0' + val;
	return val;
}

function getTimeTag (val){
	if (!val) return "-";
	var date = new Date(parseFloat(val));
	var str = date.toISOString();
	var hours = date.getHours();
	var min = round(date.getMinutes());
	var sec = round(date.getSeconds());
	return hours + ":" + min + ':' +sec ; // + " <time class='timeago' datetime='" + str + "'>" + str + "</time>"
}

function Refresh(){		
	$.ajax({ url: '/getdata', data: {}, dataType: 'json', success: function (hosts) {
			var urls = [];
			for(var i=0;i<hosts.length;i++){
				for (var u=0;u<hosts[i].urls.length;u++){
					var url = hosts[i].urls[u];
					url.host = hosts[i];
					urls.push (url);
				}
			}
			viewModel.urls (urls);
			$("table").trigger("update");
			viewModel.lastupdate(getTimeTag(new Date().getTime()))
  			$("time.timeago").timeago();

			setTimeout (Refresh, interval);
		}
	});	
}	

$(document).ready(function() {
	ko.applyBindings(viewModel);

	$("table").tablesorter({
		textExtraction:function(s){
			if($(s).find('time').length == 0) return $(s).text();
			return new Date($(s).find('time').attr('datetime')).getTime();
		}
	});
	
	$("time.timeago").timeago();
});
