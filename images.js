var watch = require('watch');
var path = require('path');
var fs = require('fs');
var gm = require('gm');
var config = require('./config.js');

function getThumbFilePath(f)
{  
  return path.join(config.thumbsDir, path.basename(f));
}

function deleteThumb(f)
{
  var thumb = getThumbFilePath(f);
  if (fs.exists(thumb))
  {
    console.log('Deleting thumb ' + thumb);
    fs.unlink(thumb, function(err) {
      if (err)
      {
        console.log(err);
      }
    });
  }
}

function createThumb(f) 
{  
  var thumb = getThumbFilePath(f);
  console.log('creating thumb ' + thumb);
  gm(f).thumb(200, 1, thumb, 50, function(err) {
    if (err)
    {
      console.log(err);
    }
  });
}

function startWatching(newFileCallback, fileDeletedCallback, fileChangedCallback)
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

exports.startWatching = startWatching;
exports.getThumbFilePath = getThumbFilePath;