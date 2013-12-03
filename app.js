var connect = require('connect');
var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var path = require('path');
var eyefi = require('eyefi');

var routes = require('./routes/index.js');
var config = require('./config.js');
var api = require('./api.js');
var mycards = require('./mycards.js');
var imgPrc = require('./imageProcessor.js');

var exampleFile = path.join(config.uploadDir, 'example.jpg');
var queue = [];

function emitQueueUpdated()
{
  io.sockets.emit('queueUpdated', { queueLength: queue.length });
}

var queueWasEmpty = false;
function checkQueue()
{
  if (queue.length == 0)
  {
    if (!queueWasEmpty)
    {
       console.log("> Queue is empty");
       emitQueueUpdated();
       queueWasEmpty = true;
    }
    return;
  }
  
  queueWasEmpty = false;
  var f = queue.shift();
  emitQueueUpdated();
  onNewFile(f);
}

setInterval(checkQueue, 5000);

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
    queue.push(f);
    emitQueueUpdated();
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
    io.sockets.emit('uploadingImage', { percent: (pct * 100.0).toFixed(2) });
    progressEmitPaused = true;
    setTimeout(function() { 
      progressEmitPaused = false; 
    }, 500);
  }
});

// create web server
var httpServer = http.createServer(app);
var io = require('socket.io').listen(httpServer);

function configure() 
{
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.use(express.logger('dev'));
 
  app.use(express.static(config.imagesDir));
  app.use(express.static(config.uploadDir));   
  app.use(express.static(config.publicDir));

  
}

function configureDev()
{
  app.use(express.errorHandler());
}

app.configure(configure);
app.configure('development', configureDev);

app.get('/', routes.index);
app.get('/single', routes.single);
app.get('/api/images', api.getImages);
app.get('/exif/:f', require('./routes/exif.js').getExif);
app.get('/histogram/:f', require('./routes/histogram.js').getHistogram);

io.sockets.on('connection', function(client) {
  console.log('> Client ' + client.id + ' connected.');
  queue.push(exampleFile);
  emitQueueUpdated();
});

io.sockets.on('disconnect', function(client) {
  console.log('> Client ' + client.id + ' disconnected.');
});

function emitNewFile(baseName, thumbName)
{
  io.sockets.emit('newFile', { 
    fileName: baseName, 
    thumbName: thumbName
  });
}

function onNewFile(f) 
{  
  var thumbName = imgPrc.getThumbName(f);  
  
  var baseName = path.basename(f);
  emitNewFile(baseName, thumbName);
}

console.log("> HTTP server running on " + config.httpServerIP + ":" + config.httpServerPort);
httpServer.listen(config.httpServerPort);