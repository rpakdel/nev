var sock = require('./sock.js');
var img = require('./img.js');
var path = require('path');
var config = require('../config.js');

var readyQueue = [];
var processQueue = [];
var processingImages = [];

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
  // check if something is available for processing
  // do not process more than one image at once if requested
  if (processQueue.length === 0 || 
     (config.processOnlyOneImage && processingImages.length >= 1))
  {
    return;
  }

  var f = processQueue.shift();
  processingImages.push(f);
  img.processFile(f, function(err) {
    processingImages.splice(processingImages.indexOf(f), 1);
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
  setInterval(checkProcessQueueAndProcess, 1000);
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
    processingLength: processingImages.length
  });
}

function getQueue(req, res)
{
  var namesOnly = req.query.namesOnly;

  if (namesOnly === undefined)
  {
    res.json({ 
      readyQueue: readyQueue,
      processQueue: processQueue,
      processingImages: processingImages
    });
  }
  else
  {
    var readyNames = [];
    for(var i in readyQueue)
    {
      readyNames.push(path.basename(readyQueue[i]));
    }
    var processNames = [];
    for(var i in processQueue)
    {
      processNames.push(path.basename(processQueue[i]));
    }
    var processingNames = [];
    for(var i in processingImages)
    {
      processingNames.push(path.basename(processingImages[i]));
    }

    res.json({
      readyQueue: readyNames,
      processQueue: processNames,
      processingImages: processingNames
    });
  }
}

exports.setup = setup;
exports.getQueueStatus = getQueueStatus;
exports.getQueue = getQueue;
exports.pushNewFile = pushNewFile;