var eyefi = require('../node-eyefi');
var imgQ = require('./imgQ.js');
var sock = require('./sock.js');
var config = require('../config.js');
var mycards = require('../mycards.js');
var path = require('path');

var isUploadingImage = false;
var currentUploadImage = null;
var currentUploadProgress = 0.0;
var eyefiConnected = false;

function getNameWithoutExtension(f) {
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  return filename;
}

function setup() {

  console.log('> Initializing Eye-Fi server');
  // create eye-fi server
  var eyefiServer = eyefi(
  {
    uploadPath : config.uploadDir,
    cards : mycards.card1
  }).start();

  eyefiServer.on('imageReceived', function(data) {
    isUploadingImage = false;
    eyefiConnected = true;
    var f = data.filename;
    if (path.extname(f) == ".jpg" || path.extname(f) == ".JPG")
    {
      console.log();
      console.log('> Eyefi server received an image: ' + f);
      imgQ.pushNewFile(f);      
    }
  });

  // show progress bar as image is being uploaded
  var progressBar = require('progress-bar').create(process.stdout);
  eyefiServer.on('uploadProgress', function(progressData) {
    isUploadingImage = true;
    var bytesReceived = progressData.received || 0;
    var bytesExpected = progressData.expected || 0;
    currentUploadProgress = (bytesReceived / bytesExpected) * 100.0;

    progressBar.update((currentUploadProgress/100.0).toFixed(2));
    sock.emitUploadingImage(currentUploadProgress);
    eyefiConnected = true;
  });

  eyefiServer.on('sessionStart', function() {
    console.log('> Eyefi upload session started');
    eyefiConnected = true;
  });

  eyefiServer.on('uploading', function(uploadData) {
    eyefiConnected = true;
    console.log('> ' + uploadData.filename + ' is being uploaded');
    currentUploadImage = getNameWithoutExtension(uploadData.filename);
  });


  setInterval(function() {
    if (!isUploadingImage) {
      eyefiConnected = false;
    }
    isUploadingImage = false;
  }, 5000);
}

function getEyeFiStatus(req, res) {
  res.json({
    eyefiConnected: eyefiConnected,
    currentUploadImage: currentUploadImage,
    currentUploadProgress: currentUploadProgress
  });
}

exports.setup = setup;
exports.getEyeFiStatus = getEyeFiStatus;