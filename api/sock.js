var img = require('./img.js');
var imgQ = require('./imgQ.js');

var io = null;

function setup(httpServer)
{
  io = require('socket.io').listen(httpServer);

  io.sockets.on('connection', function(client) {
    console.log('> Client ' + client.id + ' connected.');
  });

  io.sockets.on('disconnect', function(client) {
    console.log('> Client ' + client.id + ' disconnected.');
  });
}

function emit(event, data)
{
    io.sockets.emit(event, data);
}

var emitUploadingImagePaused = false;
function emitUploadingImage(percent)
{
  // slow down emit to once every 500ms
  if (!emitUploadingImagePaused)
  {
    io.sockets.emit('uploadingImage', { percent: percent.toFixed(2) });
    emitUploadingImagePaused = true;
    setTimeout(function() { emitUploadingImagePaused = false; }, 500);
  }
}

function on(event, callback)
{
    io.sockets.on(event, callback);
}

function emitNewFile(baseName)
{
  io.sockets.emit('newFile', { 
    fileName: baseName
  });
}

var per = 0;
function  fakeUploadImage() 
{
    emitUploadingImage(per);
    per = per + 10;
    if (per > 100)
    {
      per = 0;
    }
}

setInterval(fakeUploadImage, 250);

exports.emit = emit;
exports.on = on;
exports.emitNewFile = emitNewFile;
exports.emitUploadingImage = emitUploadingImage;
exports.setup = setup;