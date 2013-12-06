var img = require('./img.js');
var imgQ = require('./imgQ.js');

var io = null;

function setup(httpServer)
{
  io = require('socket.io').listen(httpServer);

  io.sockets.on('connection', function(client) {
    console.log('> Client ' + client.id + ' connected.');
    imgQ.push(img.exampleFile);
  });

  io.sockets.on('disconnect', function(client) {
    console.log('> Client ' + client.id + ' disconnected.');
  });
}

function emit(event, data)
{
    io.sockets.emit(event, data);
}

function on(event, callback)
{
    io.sockets.on(event, callback);
}

function emitNewFile(baseName, thumbName)
{
  io.sockets.emit('newFile', { 
    fileName: baseName, 
    thumbName: thumbName
  });
}

exports.emit = emit;
exports.on = on;
exports.emitNewFile = emitNewFile;
exports.setup = setup;