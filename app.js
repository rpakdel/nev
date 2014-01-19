var express = require('express');
var app = express();
var http = require('http');
var routes = require('./routes/index.js');
var config = require('./config.js');
var img = require('./api/img.js');
var imgQ = require('./api/imgQ.js');

// create web server
var httpServer = http.createServer(app);
// setup socket.io
require('./api/sock.js').setup(httpServer);
// setup image queue
imgQ.setup(5000);
// setup eyefi server
require('./api/eyefi.js').setup();


function configure() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.use(express.logger('dev'));

    app.use(express.static(config.imagesDir));
    app.use(express.static(config.uploadDir));
    app.use(express.static(config.artefactsDir));
    app.use(express.static(config.publicDir));
}

function configureDev() {
    app.use(express.errorHandler());
}

app.configure(configure);
app.configure('development', configureDev);

app.get('/', routes.index);
app.get('/single', routes.single);

app.get('/api/uploads', img.getExistingUploads);
app.get('/api/exif/:f', img.getExif);
app.get('/api/histogram/:f', img.getHistogram);
app.get('/api/thumbnail/:f', img.getThumbnail);
app.get('/api/optimized/:f/:w/:h', img.getViewerWidthOptimizedWidth);
app.get('/api/resize/:f/:s', img.resizeImage);
app.get('/api/queuestatus', imgQ.getQueueStatus);
app.get('/api/queue', imgQ.getQueue);
app.get('/api/pushExamples', img.pushExamples);
app.get('/api/demo', img.enableDemo);


//img.enableDebugQueue();
console.log("> HTTP server running on " + config.httpServerIP + ":" + config.httpServerPort);
httpServer.listen(config.httpServerPort);