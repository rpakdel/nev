var path = require('path');
var address = require('network-address');

var httpServerIP = address();
var httpServerPort = 8080;
var uploadDir = path.join(__dirname, 'public', 'eyefi');
var thumbsDir = path.join(__dirname, 'public', 'thumbs');

exports.uploadDir = uploadDir;
exports.thumbsDir = thumbsDir;
exports.httpServerPort = httpServerPort;
exports.httpServerIP = httpServerIP;