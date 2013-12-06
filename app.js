var express = require('express');
var app = express();
var http = require('http');
var routes = require('./routes/index.js');
var config = require('./config.js');
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
    app.use(express.static(config.publicDir));
}

function configureDev() {
    app.use(express.errorHandler());
}

app.configure(configure);
app.configure('development', configureDev);

app.get('/', routes.index);
app.get('/single', routes.single);

app.get('/api/images', require('./api/img.js').getExistingImages);
app.get('/api/exif/:f', require('./api/exif.js').getExif);
app.get('/api/histogram/:f', require('./api/histogram.js').getHistogram);
app.get('/api/queue', imgQ.getQueueSize);

console.log("> HTTP server running on " + config.httpServerIP + ":" + config.httpServerPort);
httpServer.listen(config.httpServerPort);