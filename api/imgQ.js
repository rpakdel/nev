var sock = require('./sock.js');
var img = require('./img.js');
var path = require('path');

var queue = [];

function check()
{
  if (queue.length == 0)
  {
    return;
  }

  var f = queue.shift();
  onNewFile(f);
}

function setup(interval)
{
  setInterval(check, interval);
}

function push(item)
{
  queue.push(item);
}

function onNewFile(f) 
{  
  var baseName = path.basename(f);
  sock.emitNewFile(baseName);
}

function getQueueSize(req, res)
{
    res.json({ length: queue.length });
}

exports.setup = setup;
exports.getQueueSize = getQueueSize;
exports.push = push;