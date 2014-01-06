var sock = require('./sock.js');
var img = require('./img.js');
var path = require('path');

var readyQueue = [];
var processQueue = [];

function checkReadyQueueAndEmit()
{
  if (readyQueue.length === 0)
  {
    return;
  }

  var f = readyQueue.shift();
  emitNewFileReady(f);
}

function checkProcessQueueAndProcess()
{
  if (processQueue.length === 0)
  {
    return;
  }

  var f = processQueue.shift();
  img.processFile(f, function(err) {
    if (!err)
    {
      readyQueue.push(f);
    }
    else
    {
      console.log('! Skipping ' + f + ' because ' + err);
    }
  });
}

function setup(interval)
{
  setInterval(checkProcessQueueAndProcess, interval);
  setInterval(checkReadyQueueAndEmit, interval);
}

function pushNewFile(f)
{
  processQueue.push(f);
}

function emitNewFileReady(f) 
{  
  var baseName = path.basename(f);
  sock.emitNewFile(baseName);
}

function getQueueSize(req, res)
{
    res.json({ length: readyQueue.length });
}

function getQueue(req, res)
{
  res.json({ queue: readyQueue });
}

exports.setup = setup;
exports.getQueueSize = getQueueSize;
exports.getQueue = getQueue;
exports.pushNewFile = pushNewFile;