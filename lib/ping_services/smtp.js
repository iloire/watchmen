var net = require('net');

function ping (service, callback){

  var startTime = new Date();
  var timeout = service.timeout || 10000;
  var socket = net.createConnection(service.host.port, service.host.host); // http://nodejs.org/api/net.html

  var callbackExecuted = false;

  socket.setTimeout(service.timeout || 10000, function () {
    callbackExecuted = true;
    socket.end("bye!");
    callback('Timeout (took more than ' + timeout +  ' ms)', null, null, null);
  });

  //TODO: implement logic to validate and actual SMTP server (here we are just checking that it responds)
  socket.on("data", function (c) {
    socket.end("bye!");
  });
  
  socket.on("error", function () { // The 'close' event will be called directly following this event.
    if (callbackExecuted) {
      callback("Could not open socket", null, null, null);
    }
    callbackExecuted = true;
  });

  socket.on("close", function () {
    if (!callbackExecuted) {
      callback("Socket closed", null, null, null);
    }
  });

  socket.on("end", function (data) {
    if (!callbackExecuted) {
      var timeDiff = (new Date() - startTime);
      callback(null, null, null, timeDiff);
    }
  });
}

module.exports.ping = ping;
