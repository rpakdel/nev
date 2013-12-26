var watch = require('watch');
var path = require('path');
var config = require('../config.js');
var path = require('path');
var exif = require('exif2');
var exec = require('child_process').exec;
var fs = require('fs');

var exampleIndex = 0;
var exampleFile = path.join(config.uploadDir, 'example.jpg');
var exampleFiles = [
  path.join(config.uploadDir, 'example.jpg'),
  path.join(config.uploadDir, 'example1.jpg'),
  path.join(config.uploadDir, 'example2.jpg'),
  path.join(config.uploadDir, 'example3.jpg'),
  path.join(config.uploadDir, 'example4.jpg'),
  path.join(config.uploadDir, 'example5.jpg') ];

function queueNextExample()
{
    require('./imgQ.js').push(exampleFiles[exampleIndex]);
    exampleIndex++;
    if (exampleIndex >= exampleFiles.length) 
    { 
      exampleIndex = 0; 
    }
}

function enableDebugQueue()
{
  console.log('Queueing example images every 4000ms.');
  setInterval(queueNextExample, 6000);
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
      res.send(err);
    }
    else
    {      
      var uploads = [];
      for(var i in files)
      {        
        var imageName = files[i];
        if (imageName.indexOf('_THUMB') == -1 &&
            imageName.indexOf('_HIS') == -1)
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

function getThumbName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var thumbName = filename + '_THUMB' + extname;
  return thumbName;
}

function getThumbPath(f)
{
  var dirname = path.dirname(f);
  var thumbName = getThumbName(f);
  var thumbPath = path.join(dirname, thumbName);
  return thumbPath;
}

function getHisName(f)
{
  var extname = path.extname(f);
  var filename = path.basename(f, extname);
  var hisName = filename + '_HIS' + extname;
  return hisName;
}

function getHisPath(f)
{
  var dirname = path.dirname(f);
  var hisName = getHisName(f);
  var hisPath = path.join(dirname, hisName);
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
  var dirname = path.dirname(f);
  var miffName = getMiffName(f);
  var miffPath = path.join(dirname, miffName);
  return miffPath;  
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
    console.log('> Resize process stdout: ' + stdout);
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
    'gm convert ' + thumbPath + 
    ' histogram:' + miffPath + 
    sep +
    'gm convert ' + miffPath + ' ' + hisPath;
  var child = exec(hisCommand, function (error, stdout, stderr) {
    console.log(' Histogram process stdout: ' + stdout);
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
            existing: true
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



exports.exampleFile = exampleFile;
exports.getThumbName = getThumbName;
exports.getThumbPath = getThumbPath;
exports.getHisName = getHisName;
exports.getHisPath = getHisPath;
exports.getExifData = getExifData;
exports.createHistogram = createHistogram;

exports.enableDebugQueue = enableDebugQueue;

// web-api
exports.getHistogram = getHistogram;
exports.getThumbnail = getThumbnail;
exports.getExistingUploads = getExistingUploads;
exports.getExif = getExif;
