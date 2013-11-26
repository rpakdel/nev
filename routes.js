var config = require('./config.js');

function index(req, res) 
{
  res.render('single.jade', { serverIp: config.httpServerIP });
}

function single(req, res)
{
  res.render('single.jade', { serverIp: config.httpServerIP });
}

exports.index = index;
exports.single = single;