exports.mocked_response = {}

function processRequest (url_conf, callback) {
	callback(exports.mocked_response.error, exports.mocked_response.body, exports.mocked_response.response, exports.mocked_response.timeDiff);
}
exports.processRequest = processRequest
