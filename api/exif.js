var exif = require('exif2');
var path = require('path');
var config = require('../config.js');
var img = require('./img.js');

function getExif(req, res)
{
    var fileName = req.params.f
    var f = path.join(config.uploadDir, fileName);

    var exifData = {
      iso: '',
      aperture: '',
      focalLength: '',
      shutterSpeed: '',
  };
  
  img.getExifData(f, exifData, function(exifError) {
    res.json(exifData);
  });
}

exports.getExif = getExif;