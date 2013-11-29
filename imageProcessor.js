var path = require('path');
var exif = require('exif2');
var exec = require('child_process').exec;
var fs = require('fs');

function prepareFile(filename) 
{
  createHistogram(path.join(config.uploadDir, filename), function(error) {
    if (error)
    {
      console.log('! No histogram created.');
    }
    else
    {
      console.log('> Created thumbnail histogram for ' + filename);
    }
    queue.push(path.join(config.uploadDir, filename));
  });
}

function getHistogramData(f, histogramData)
{
  console.log("> Getting histogram data.");
  histogram(f, function (err, data) {
    if (err) 
    {
      console.log(err);
    }
    else
    {
      console.log(f + ' has ' + data.colors.rgba + ' colors');
      histogramData.red = data.red;
      histogramData.green = data.green;
      histogramData.blue = data.blue;
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
    if (error !== null) 
    {
      if (fs.exists(miffPath))
      {
        fs.unlinkSync(miffPath);
      }
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

exports.getThumbName = getThumbName;
exports.getThumbPath = getThumbPath;
exports.getHisName = getHisName;
exports.getExifData = getExifData;
exports.createHistogram = createHistogram;