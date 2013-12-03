var path = require('path');
var address = require('network-address');

var httpServerIP = address();
var httpServerPort = 8080;
var publicDir = path.join(__dirname, 'public');
var uploadDir = path.join(publicDir, 'eyefi');
var imagesDir = path.join(publicDir, 'images');

exports.publicDir = publicDir;
exports.uploadDir = uploadDir;
exports.imagesDir = imagesDir;
exports.httpServerPort = httpServerPort;
exports.httpServerIP = httpServerIP;