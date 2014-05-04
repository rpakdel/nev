var path = require('path');
var address = require('network-address');

var httpServerIp = address();
var publicDir = path.join(__dirname, 'public');
var uploadDir = 'c:\\eyefi'
var imagesDir = path.join(publicDir, 'images');
var artefactsDir = path.join(uploadDir, 'artefacts');
var processOnlyOneImage = true;
var showRunDemoButton = true;

exports.publicDir = publicDir;
exports.uploadDir = uploadDir;
exports.imagesDir = imagesDir;
exports.artefactsDir = artefactsDir;

exports.httpServerIP = httpServerIp;
exports.processOnlyOneImage = processOnlyOneImage;
exports.showRunDemoButton = showRunDemoButton;
