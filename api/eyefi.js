var eyefi = require('eyefi');
var imgQ = require('./imgQ.js');
var sock = require('./sock.js');
var config = require('../config.js');
var mycards = require('../mycards.js');
var path = require('path');

function setup()
{
  console.log('> Initializing Eye-Fi server');
  // create eye-fi server
  var eyefiServer = eyefi(
  {
    uploadPath : config.uploadDir,
    cards : mycards.card1
  }).start();

  eyefiServer.on('imageReceived', function(data) {
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
    var bytesReceivd = progressData.received || 0;
    var bytedExpected = progressData.expected || 0;
    var pct = (bytesReceived / bytesExpected) * 100.0;

    progressBar.update((pct/100.0).toFixed(2));
    sock.emitUploadingImage(pct);
  });
}

exports.setup = setup;