var sock = require('./sock.js');
var img = require('./img.js');
var path = require('path');
var config = require('../config.js');

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

var processingImage = false;
function checkProcessQueueAndProcess()
{
  // check if something is available for processing
  // do not process more than one image at once if requested
  if (processQueue.length === 0 || 
     (config.processOnlyOneImage && processingImage))
  {
    return;
  }

  processingImage = true;

  var f = processQueue.shift();
  img.processFile(f, function(err) {
    processingImage = false;
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

function getQueueStatus(req, res)
{
  res.json({ 
    processQueueLength: processQueue.length,
    readyQueueLength: readyQueue.length,
    processing: processingImage
  });
}

function getQueue(req, res)
{
  res.json({ 
    readyQueue: readyQueue,
    processQueue: processQueue 
  });
}

exports.setup = setup;
exports.getQueueStatus = getQueueStatus;
exports.getQueue = getQueue;
exports.pushNewFile = pushNewFile;