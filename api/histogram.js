var path = require('path');
var fs = require('fs');
var config = require('../config.js');
var img = require('./img.js');

function getHistogram(req, res)
{
    var fileName = req.params.f
    var f = path.join(config.uploadDir, fileName);

    var thumbPath = img.getThumbPath(f);
    var hisName = img.getHisName(thumbPath);
    var hisPath = img.getHisPath(thumbPath);

    if (fs.exists(hisPath))
    {
        res.json({ histogramName: hisName });
    }
    else
    {
        img.createHistogram(f, function(error) {      
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
}

exports.getHistogram = getHistogram;