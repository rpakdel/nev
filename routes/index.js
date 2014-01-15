var config = require('../config.js');
var img = require('../api/img.js');

function index(req, res) 
{
  var isDemoEnabled = img.isDemoEnabled();
  res.render('single.jade', { 
    host: config.httpServer, 
    showRunDemoButton: config.showRunDemoButton && !isDemoEnabled
  });
}

function single(req, res)
{
  var isDemoEnabled = img.isDemoEnabled();
  res.render('single.jade', { 
    host:config.httpServer,
    showRunDemoButton: config.showRunDemoButton && !isDemoEnabled
  });
}



exports.index = index;
exports.single = single;