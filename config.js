var path = require('path');
var address = require('network-address');

var httpServerIp = address();
var httpServerPort = 8080;
var publicDir = path.join(__dirname, 'public');
var uploadDir = path.join(publicDir, 'eyefi');
var imagesDir = path.join(publicDir, 'images');
var processOnlyOneImage = true;
var showRunDemoButton = true;

exports.publicDir = publicDir;
exports.uploadDir = uploadDir;
exports.imagesDir = imagesDir;
exports.httpServerPort = httpServerPort;
exports.httpServerIP = httpServerIp;
exports.httpServer = httpServerIp + ':' + httpServerPort;
exports.processOnlyOneImage = processOnlyOneImage;
exports.showRunDemoButton = showRunDemoButton;
