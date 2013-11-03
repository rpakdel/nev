var fs = require('fs');
var config = require('./config.js');
var images = require('./images.js');

function getImages(req, res)
{
  fs.readdir(config.imagesDir, function(err, files) {
    if (err)
    {
      console.log('err ' + err);
      res.send(err);
    }
    else
    {      
      var slides = [];
      for(var i in files)
      {        
        var imagePath = '/images/' + files[i];
        var thumbPath = '/thumbs/' + files[i];
        var s = {
          image: imagePath,
          title: files[i],
          thumb: thumbPath
        };
        slides.push(s);
      }
      console.log('sending ' + JSON.stringify(slides));
      res.send(slides);
    }
  });
}

exports.getImages = getImages;