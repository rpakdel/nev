var path = require('path');
var fs = require('fs');
var config = require('../config.js');
var imgPrc = require('../imageProcessor.js');


function getHistogram(req, res)
{
    var fileName = req.params.f
    var f = path.join(config.uploadDir, fileName);

    var thumbPath = imgPrc.getThumbPath(f);
    var hisName = imgPrc.getHisName(thumbPath);
    var hisPath = imgPrc.getHisPath(thumbPath);

    if (fs.exists(hisPath))
    {
        res.json({ histogramName: hisName });
    }
    else
    {
        imgPrc.createHistogram(f, function(error) {      
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