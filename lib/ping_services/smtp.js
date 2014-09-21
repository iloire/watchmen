var net = require('net');

function ping (service, callback){

  var startTime = new Date();
  var timeout = service.timeout || 10000;
  var socket = net.createConnection(service.host.port, service.host.host);

  socket.setTimeout(service.timeout || 10000, function () {
    callback('Timeout (took more than ' + timeout +  ' ms)', null, null, null);
  });

  //TODO: implement logic to validate and actual SMTP server (here we are just checking that it responds)
  socket.on("data", function (c) {
    socket.end("bye!");
  });
  
  socket.on("error", function () {
	callback("Could not open socket", null, null, null);
  });
  socket.on("end", function () {
    var timeDiff = (new Date() - startTime);
    callback(null, null, null, timeDiff);
  });
}

module.exports.ping = ping;
