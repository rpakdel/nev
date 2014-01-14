var config = require('../config.js');

function index(req, res) 
{
  res.render('single.jade', { 
    host: config.httpServer, 
    showRunDemoButton: config.showRunDemoButton 
  });
}

function single(req, res)
{
  res.render('single.jade', { 
    host:config.httpServer,
    showRunDemoButton: config.showRunDemoButton 
  });
}



exports.index = index;
exports.single = single;