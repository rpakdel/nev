var connect = require('connect');
var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var path = require('path');
var routes = require('./routes.js');
var images = require('./images.js');
var config = require('./config.js');
var api = require('./api.js');
var eyefi = require('eyefi');
var exif = require('exif2');
var exec = require('child_process').exec;
var mycards = require('./mycards.js');

var queue = [];

function prepareFile(filename) 
{
  createHistogram(path.join(config.uploadDir, filename), function(error) {
    if (error)
    {
      console.log('! No histogram created.');
    }
    else
    {
      console.log('> Created thumbnail histogram for ' + filename);
    }
    queue.push(path.join(config.uploadDir, filename));
  });
}

//prepareFile('DSC_1412.JPG');
//prepareFile('DSC_1413.JPG');
//prepareFile('DSC_1414.JPG');
//prepareFile('DSC_1415.JPG');
//prepareFile('DSC_1416.JPG');

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
    createHistogram(f, function(error) {
      if (error)
      {
        console.log('! No histogram created for ' + f);
      }
      queue.push(f);
      emitQueueUpdated();
    });
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
 
  app.use(express.static(__dirname + path.join('/public', 'supersized-3.2.7', 'slideshow')));
  app.use(express.static(__dirname + path.join('/public', 'photoswipe-3.0.5')));
  app.use(express.static(__dirname + path.join('/public', 'images')));
  app.use(express.static(__dirname + path.join('/public', 'eyefi')));
  app.use(express.static(__dirname + '/public'));
}

function configureDev()
{
  app.use(express.errorHandler());
}

app.configure(configure);
app.configure('development', configureDev);

app.get('/', routes.index);
app.get('/supersized', routes.supersized);
app.get('/photoswipe', routes.photoswipe);
app.get('/single', routes.single);
app.get('/api/images', api.getImages);

io.sockets.on('connection', function(client) {
  console.log('> Client ' + client.id + ' connected.');
  queue.push(path.join(config.uploadDir, 'DSC_1412.JPG'));
});

io.sockets.on('disconnect', function(client) {
  console.log('> Client ' + client.id + ' disconnected.');
});

function getHistogramData(f, histogramData)
{
  console.log("> Getting histogram data.");
  histogram(f, function (err, data) {
    if (err) 
    {
      console.log(err);
    }
    else
    {
      console.log(f + ' has ' + data.colors.rgba + ' colors');
      histogramData.red = data.red;
      histogramData.green = data.green;
      histogramData.blue = data.blue;
    }
  });
}

function getThumbName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var thumbName = filename + '_THUMB' + extname;
  return thumbName;
}

function getThumbPath(f)
{
  var dirname = path.dirname(f);
  var thumbName = getThumbName(f);
  var thumbPath = path.join(dirname, thumbName);
  return thumbPath;
}

function getHisName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var hisName = filename + '_HIS' + extname;
  return hisName;
}

function getHisPath(f)
{
  var dirname = path.dirname(f);
  var hisName = getHisName(f);
  var hisPath = path.join(dirname, hisName);
  return hisPath;
}

function getMiffName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var miffname = filename + '.miff';
  return miffname;
}

function getMiffPath(f)
{
  var dirname = path.dirname(f);
  var miffName = getMiffName(f);
  var miffPath = path.join(dirname, miffName);
  return miffPath;  
}

function createThumbnail(f, callback)
{
  var thumbName = getThumbName(f);
  var thumbPath = getThumbPath(f);
  
  console.log('> Creating thumbnail ' + thumbName);
  var resizeCommand =
    'gm convert -size 512x512 ' + f +
    ' -resize 512x512 ' + thumbPath;
    
  var resizeChildProcess = exec(resizeCommand, function (error, stdout, stderr) {
    console.log('> Resize process stdout: ' + stdout);
    if (error !== null) 
    {
      console.log('! Resize process exec error: ' + error);
      console.log('! Resize process stderr: ' + stderr);
      callback(error);
    }
    else
    {
      callback(null);
    }
  });
}

function createThumbHistogram(thumbPath, callback)
{
  var hisName = getHisName(thumbPath);
  var hisPath = getHisPath(thumbPath);
  var miffPath = getMiffPath(thumbPath);

  console.log('> Creating thumbnail histogram ' + hisName);
  var hisCommand = 
    'gm convert ' + thumbPath + 
    ' histogram:' + miffPath + 
    '; gm convert ' + miffPath + ' ' + hisPath + 
    '; rm -f ' + miffPath;
  var child = exec(hisCommand, function (error, stdout, stderr) {
    console.log(' Histogram process stdout: ' + stdout);
    if (error !== null) 
    {
      console.log('! Histogram process exec error: ' + error);
      console.log('! Histogram process stderr: ' + stderr);
      callback(error);
    }
    else
    {
      callback(null);
    }
  });
}

function createHistogram(f, callback)
{
  var thumbPath = getThumbPath(f);
  
  createThumbnail(f, function(thumbError) {
    if (thumbError)
    {
      console.log('! failed to create thumbnail.');
      callback(thumbError);
    }
    else
    {
      createThumbHistogram(thumbPath, function(hisError) {
        callback(hisError);
      });
    }
  });
}

var focalLengthRegExp = /[\d\.]+/i;
function getExifData(f, result, callback)
{
  exif(f, function(err, exifData) {
    if (err)
    {
      console.log('! EXIF Error: ' + err.message);
      callback(err);
    }
    else
    {
      console.log('> got EXIF data.');
      //console.log(exifData);
      result.iso = exifData['iso'];
      result.aperture = exifData['aperture'];
      result.focalLength = exifData['focal length'].match(focalLengthRegExp);
      result.shutterSpeed = exifData['shutter speed'];
      callback(null);
    }
  });
}

function emitNewFile(baseName, thumbName, histogramName, exifData)
{
  io.sockets.emit('newFile', { 
    fileName: baseName, 
    thumbName: thumbName,
    histogramName: histogramName,
    exifData: exifData,
  });
}

function onNewFile(f) 
{
  console.log('> Preparing ' + f + ' for clients.');
  var thumbName = getThumbName(f);
  var thumbPath = getThumbPath(f);
  var hisName = getHisName(thumbPath);
  
  var exifData = {
    iso: '',
    aperture: '',
    focalLength: '',
    shutterSpeed: '',
  };
  
  getExifData(f, exifData, function(exifError) {
    var baseName = path.basename(f);
    emitNewFile(baseName, thumbName, hisName, exifData);
  });
}

//images.startWatching(onNewFile, null, null);
console.log("> HTTP server running on " + config.httpServerIP + ":" + config.httpServerPort);

httpServer.listen(config.httpServerPort);