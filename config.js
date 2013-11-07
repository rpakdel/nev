var path = require('path');

var httpServerIP = require('os').networkInterfaces().eth0[0].address;
var httpServerPort = 8080;
var uploadDir = path.join(__dirname, 'public', 'eyefi');
var thumbsDir = path.join(__dirname, 'public', 'thumbs');

exports.uploadDir = uploadDir;
exports.thumbsDir = thumbsDir;
exports.httpServerPort = httpServerPort;
exports.httpServerIP = httpServerIP;