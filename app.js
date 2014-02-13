var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var config = require('./config.js');
var img = require('./api/img.js');
var imgQ = require('./api/imgQ.js');


var app = express();
// create web server
var httpServer = http.createServer(app);
// setup socket.io
require('./api/sock.js').setup(httpServer);
// setup image queue
imgQ.setup(5000);
// setup eyefi server
require('./api/eyefi.js').setup();


// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(config.publicDir));

app.use(express.static(config.imagesDir));
app.use(express.static(config.uploadDir));
app.use(express.static(config.artefactsDir));
app.use(express.static(config.publicDir));
app.use(express.favicon('favicon.ico'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/api/uploads', img.getExistingUploads);
app.get('/api/exif/:f', img.getExif);
app.get('/api/exifall/:f', img.getExifAll);
app.get('/api/histogram/:f', img.getHistogram);
app.get('/api/thumbnail/:f', img.getThumbnail);
app.get('/api/optimized/:f/:w/:h', img.getViewerWidthOptimizedWidth);
app.get('/api/resize/:f/:s', img.resizeImage);
app.get('/api/queuestatus', imgQ.getQueueStatus);
app.get('/api/queue', imgQ.getQueue);
app.get('/api/pushExamples', img.pushExamples);
app.get('/api/demo', img.enableDemo);

httpServer.listen(app.get('port'), function() {
  console.log("> HTTP server running on " + config.httpServerIP + ":" + app.get('port'));
});
