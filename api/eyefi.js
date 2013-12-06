var eyefi = require('eyefi');
var imgQ = require('./imgQ.js');
var sock = require('./sock.js');
var config = require('../config.js');
var mycards = require('../mycards.js');

function setup()
{
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
      imgQ.push(f);      
    }
  });

  // show progress bar as image is being uploaded
  var progressBar = require('progress-bar').create(process.stdout);
  var progressEmitPaused = false;
  eyefiServer.on('uploadProgress', function(progressData) {
    var br = progressData.received || 0;
    var be = progressData.expected || 0;
    var pct = (100*br/be).toFixed(2)/100.0;

    progressBar.update(pct);
    if(!progressEmitPaused  || br==be) 
    {
      sock.emit('uploadingImage', { percent: (pct * 100.0).toFixed(2) });
      progressEmitPaused = true;
      setTimeout(function() { 
        progressEmitPaused = false; 
      }, 500);
    }
  });
}

exports.setup = setup;