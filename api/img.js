var watch = require('watch');
var path = require('path');
var config = require('../config.js');
var path = require('path');
var exif = require('exif2');
var exec = require('child_process').exec;
var fs = require('fs');
var gm = require('gm');
var imgQ = require('./imgQ.js');

var imageScales = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];

var exampleIndex = 0;
var exampleFiles = [
  path.join(config.uploadDir, 'example.jpg'),
  path.join(config.uploadDir, 'example1.jpg'),
  path.join(config.uploadDir, 'example2.jpg'),
  path.join(config.uploadDir, 'example3.jpg'),
  path.join(config.uploadDir, 'example4.jpg'),
  path.join(config.uploadDir, 'example5.jpg'),
  path.join(config.uploadDir, 'example6.jpg'),
  path.join(config.uploadDir, 'example7.jpg'),
  path.join(config.uploadDir, 'example8.jpg'), ];

function queueAllExamples()
{
  console.log('Queueing all example files.');
  for (var i in exampleFiles)
  {
    imgQ.pushNewFile(exampleFiles[i]);
  }
}

function queueNextExample()
{
    imgQ.pushNewFile(exampleFiles[exampleIndex]);
    exampleIndex++;
    if (exampleIndex >= exampleFiles.length) 
    { 
      exampleIndex = 0; 
    }
}

var demoEnabled = false;
function enableDebugQueue()
{
  if (!demoEnabled)
  {
    demoEnabled = true;    
  }
}

function isDemoEnabled()
{
  return demoEnabled;
}

function startWatchingDir(newFileCallback, fileDeletedCallback, fileChangedCallback)
{
  var imagesDir = config.imagesDir;
  var thumbsDir = config.thumbsDir;
  console.log("Watching dir " + imagesDir); 
  console.log("Thumbs will be created in " + thumbsDir);   
  watch.watchTree(imagesDir, function(f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) 
    {
      // Finished walking the tree
      console.log('Initial scan complete');
    }
    else if (prev === null) 
    {
      // New file
      if (path.extname(f) == ".jpg" || path.extname(f) == ".JPG")
      {
        console.log('New: ' + f);        
        deleteThumb(f);        
        createThumb(f);
        if (newFileCallback)
        {
          newFileCallback(f);
        }
      }
      else
      {
        console.log('Ignoring new file ' + f);
      }
    } 
    else if (curr.nlink === 0) 
    {
      // file was removed
      if (path.extname(f) == ".jpg" || path.extname(f) == ".JPG")
      {
        console.log('Removed: ' + f);        
        deleteThumb(f);
        if (fileDeletedCallback)
        {
         fileDeletedCallback(f);
        }
      }
      else
      {
        console.log('Ignoring removed file ' + f);
      }
    } 
    else 
    {
      // file was changed
      if (path.extname(f) == ".jpg" || path.extname(f) == ".JPG")
      {
        console.log('Changed: ' + f);
        deleteThumb(f);        
        createThumb(f);
        if (fileChangedCallback)
        {
          fileChangedCallback(f);
        }
      }
      else
      {
        console.log('Ignoring changed file ' + f);
      }
    }
  });
}

function getExistingUploads(req, res)
{
  fs.readdir(config.uploadDir, function(err, files) {
    if (err)
    {
      console.log('err ' + err);
      res.json(err);
    }
    else
    {      
      var uploads = [];
      for(var i in files)
      {        
        var imageName = files[i];
        if (imageName.indexOf('_THUMB') == -1 &&
            imageName.indexOf('_HIS') == -1 &&
            imageName.indexOf('artefacts') == -1)
        {
          var stats = fs.statSync(path.join(config.uploadDir, imageName));
          // use same JSON as onNewFile()
          var s = {
            fileName: imageName,
            mtime: stats.mtime
          };
          uploads.push(s);
        }
      }
      console.log('sending ' + JSON.stringify(uploads));
      res.json(uploads);
    }
  });
}

function getSizeName(f, scale)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var sizeName = filename + '_' + scale + extname;
  return sizeName;
}

function getSizePath(f, size)
{
  var sizeName = getSizeName(f, size);
  var sizePath = path.join(config.artefactsDir, sizeName);
  return sizePath;
}


function getThumbName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var thumbName = filename + '_THUMB' + extname;
  return thumbName;
}

function getThumbPath(f)
{
  var thumbName = getThumbName(f);
  var thumbPath = path.join(config.artefactsDir, thumbName);
  return thumbPath;
}

function getHisName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var hisName = filename + '_HIS' + extname;
  //var hisName = filename + '_HIS.gif';
  return hisName;
}

function getHisPath(f)
{
  var hisName = getHisName(f);
  var hisPath = path.join(config.artefactsDir, hisName);
  return hisPath;
}

function getMiffName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var miffname = filename + '.miff';
  return miffname;
}

function getMiffPath(f)
{
  var miffName = getMiffName(f);
  var miffPath = path.join(config.artefactsDir, miffName);
  return miffPath;  
}

function createResizedImage(f, scale, callback)
{
  var sizeName = getSizeName(f, scale);
  var sizePath = getSizePath(f, scale);

  gm(f).size(function (err, size) {
    if (!err)
    {
        console.log('> Creating resized image ' + sizeName);
        var newW = size.width * scale;
        var newH = size.height * scale;
        var resizeCommand =
        'gm convert -size ' + newW + 'x' + newH + ' ' + f +
        ' -resize ' + newW + 'x' + newH + ' ' + sizePath;
    
        var resizeChildProcess = exec(resizeCommand, function (error, stdout, stderr) {
            //console.log('> Resize process stdout: ' + stdout);
            if (error !== null) 
            {
                console.log('! Resize process exec error: ' + error);
                console.log('! Resize process stderr: ' + stderr);
                callback(error);
            }
            else
            {
               callback(null);
            }
        });
    }
    else
    {
        callback(err);
    }
  });
}

function createResizedImageIfNotExisting(f, scale, callback)
{
  var sizeName = getSizeName(f, scale);
  var sizePath = getSizePath(f, scale);

  fs.exists(sizePath, function(exists) {
    if (exists)
    {
      callback(null);
    }
    else
    {
      createResizedImage(f, scale, callback);
    }
  });
}

function createThumbnail(f, callback)
{
  var thumbName = getThumbName(f);
  var thumbPath = getThumbPath(f);
  
  console.log('> Creating thumbnail ' + thumbName);
  var resizeCommand =
    'gm convert -size 512x512 ' + f +
    ' -resize 512x512 ' + thumbPath;
    
  var resizeChildProcess = exec(resizeCommand, function (error, stdout, stderr) {    
    //console.log('> Resize process stdout: ' + stdout);
    if (error !== null) 
    {
      console.log('! Resize process exec error: ' + error);
      console.log('! Resize process stderr: ' + stderr);
      callback(error);
    }
    else
    {
      callback(null);
    }
  });
}

function getOSCommandSep()
{
    switch(process.platform)
    {
        case 'win32':
          return ' && ';

        default:
          return ' ; ';
    }
}

function createThumbHistogram(thumbPath, callback)
{
  var hisName = getHisName(thumbPath);
  var hisPath = getHisPath(thumbPath);
  var miffPath = getMiffPath(thumbPath);

  console.log('> Creating thumbnail histogram ' + hisName);
  var sep = getOSCommandSep();
  var hisCommand = 
    'gm convert -size 512x512 ' + thumbPath + 
    ' histogram:' + miffPath + 
    sep +
    'gm convert -strip ' + miffPath + ' ' + hisPath;
  var child = exec(hisCommand, function (error, stdout, stderr) {
    //console.log(' Histogram process stdout: ' + stdout);
    if (fs.existsSync(miffPath))
    {
      fs.unlinkSync(miffPath);
    }
    if (error !== null) 
    {
      console.log('! Histogram process exec error: ' + error);
      console.log('! Histogram process stderr: ' + stderr);
      callback(error);
    }
    else
    {
      callback(null);
    }
  });
}

function createHistogramIfNotExisting(f, callback)
{
  var thumbPath = getThumbPath(f);
  var hisPath = getHisPath(thumbPath);

  fs.exists(hisPath, function(exists) {
    if (!exists)
    {
      createHistogram(f, callback);
    }
    else
    {
      callback(null);
    }
  });
}

function createHistogram(f, callback)
{
  var thumbPath = getThumbPath(f);
  
  createThumbnail(f, function(thumbError) {
    if (thumbError)
    {
      console.log('! failed to create thumbnail.');
      callback(thumbError);
    }
    else
    {
      createThumbHistogram(thumbPath, function(hisError) {
        callback(hisError);
      });
    }
  });
}

var focalLengthRegExp = /[\d\.]+/i;
function getExifData(f, result, callback)
{
  exif(f, function(err, exifData) {
    if (err)
    {
      console.log('! EXIF Error: ' + err.message);
      callback(err);
    }
    else
    {
      console.log('> got EXIF data.');
      if (exifData['iso'])
      {
        result.iso = exifData['iso'];
      }

      if (exifData['aperture'])
      {
        result.aperture = exifData['aperture'];
      }

      if (exifData['focal length'])
      {
        result.focalLength = exifData['focal length'].match(focalLengthRegExp)[0];
      }

      if (exifData['shutter speed'])
      {
        result.shutterSpeed = exifData['shutter speed'];
      }

      callback(null);
    }
  });
}

function getHistogram(req, res)
{
    var fileName = req.params.f;
    var f = path.join(config.uploadDir, fileName);

    var thumbPath = getThumbPath(f);
    var hisName = getHisName(thumbPath);
    var hisPath = getHisPath(thumbPath);

    fs.exists(hisPath, function(exists) {
      if (exists)
      {
        res.json({ histogramName: hisName });
      }
      else
      {
        createHistogram(f, function(error) {
            if (error)
            {        
                res.json({ histogramName: '' });
            }
            else
            {          
                res.json({ histogramName: hisName });
            }      
        });
      }
    });
    
}

function createThumbnailIfNotExisting(f, callback)
{
  var thumbName = getThumbName(f);
  var thumbPath = getThumbPath(f);

  fs.exists(thumbPath, function(exists) {
    if (!exists)
    {
      createThumbnail(f, callback);
    }
    else
    {
      callback(null);
    }
  });
}

function getThumbnail(req, res)
{
    var fileName = req.params.f;
    var f = path.join(config.uploadDir, fileName);

    var thumbName = getThumbName(f);
    var thumbPath = getThumbPath(f);

    fs.exists(thumbPath, function(exists) {
      if (exists)
      {
        res.json({ 
            thumbName: thumbName,
            generated: false,
            existing: true,
            generating: true
          });
      }
      else
      {
        createThumbnail(f, function(error) {
          if (error)
          {        
              res.json({ 
                  thumbName: '',
                  generated: false,
                  existing: false
                });
          }
          else
          {          
              res.json({ 
                  thumbName: thumbName,
                  generated: true,
                  existing: false 
                });
          }
        });
      }
    });
}

function getExif(req, res)
{
    var fileName = req.params.f;
    var f = path.join(config.uploadDir, fileName);

    var exifData = {
      iso: '',
      aperture: '',
      focalLength: '',
      shutterSpeed: ''
  };
  
  getExifData(f, exifData, function(exifError) {
    res.json(exifData);
  });
}

function getExifAll(req, res)
{
  var fileName = req.params.f;
  var f = path.join(config.uploadDir, fileName);

  exif(f, function(err, exifData) {
    if (err)
    {
      res.json(err);
    }
    else
    {
      res.json(exifData);
    }
  });
}

function getViewerWidthOptimizedWidth(req, res)
{
  var fileName = req.params.f;
  var f = path.join(config.uploadDir, fileName);

  var screenW = parseInt(req.params.w);
  var screenH = parseInt(req.params.h);

  var screenP = screenW * screenH;

  gm(f).size(function (err, size) {
    var result = {
      screenWidth: screenW,
      screenHeight: screenH,
      screenPixels: screenP,
      imageWidth: -1,
      imageHeight: -1,
      imagePixels: -1, 
      newWidth: -1,
      newHeight: -1,
      newPixels: -1,
      scale: 1.0
    };
    if (!err)
    {
      result.imageWidth = size.width;
      result.imageHeight = size.height;
      var imagePixels = size.width * size.height;
      result.imagePixels = imagePixels;
      var scaleIndex = 1; // 0 is no resize
      for (scaleIndex = 1; scaleIndex < imageScales.length; scaleIndex++)
      {
          var scale = imageScales[scaleIndex];
          var w = size.width * scale;
          var h = size.height * scale;
          var p = w * h;

          if (p < screenP)
          {
              break;
          }
      }

      // use one size larger
      result.scale = imageScales[scaleIndex - 1];
      result.newWidth = size.width * result.scale;
      result.newHeight = size.height * result.scale;
      result.newPixels = result.newWidth * result.newHeight;
    }
    res.json(result);
  });
}

function resizeImage(req, res)
{
  var fileName = req.params.f;
  var f = path.join(config.uploadDir, fileName);

  var scale = parseFloat(req.params.s);

  createResizedImageIfNotExisting(f, scale, function(err) {
    var result = {
        imageName: getSizeName(f, scale),
        success: false
      };
    if (!err) 
    {
      result.success = true;
    }
    res.json(result);
  });
}

function enableDemo(req, res)
{
  enableDebugQueue();
  res.send(200);
}

function pushExamples(req, res)
{
  enableDebugQueue();
  queueAllExamples();
  res.send(200);
}

function processFile(f, callback)
{
  var resizeNextF = function(i, callback1) {
    if (i < imageScales.length)
    {
      createResizedImageIfNotExisting(f, imageScales[i], function(err) {
        if (!err)
        {
          i++;
          resizeNextF(i, callback1);
        }
        else
        {
          callback1(err);
        }
      });
    }
    else
    {
      callback1(null);
    }
  };

  createHistogramIfNotExisting(f, function(hisErr) {
    if (!hisErr)
    {
      resizeNextF(0, function(resizeErr) {
        if (!resizeErr)
        {
          callback(null);
        }
        else
        {          
          callback(resizeErr);
        }
      });
    }
    else
    {
      callback(hisErr);
    }
  });
}

exports.getThumbName = getThumbName;
exports.getThumbPath = getThumbPath;
exports.getHisName = getHisName;
exports.getHisPath = getHisPath;
exports.getExifData = getExifData;
exports.createHistogram = createHistogram;
exports.processFile = processFile;
exports.enableDebugQueue = enableDebugQueue;


// web-api
exports.getHistogram = getHistogram;
exports.getThumbnail = getThumbnail;
exports.getExistingUploads = getExistingUploads;
exports.getExif = getExif;
exports.getExifAll = getExifAll;
exports.getViewerWidthOptimizedWidth = getViewerWidthOptimizedWidth;
exports.resizeImage = resizeImage;
exports.enableDemo = enableDemo;
exports.isDemoEnabled = isDemoEnabled;
exports.pushExamples = pushExamples;