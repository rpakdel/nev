var playbackState = 'play';
var checkQueueTimeout = 500;
var viewModel;

function getScreenOptimizedImage(imageName, callback)
{
  var newImageName = imageName;
  $.get(
    'api/optimized/' + imageName + '/' + $(window).width() + '/' + $(window).height(),
    function (optimizedData) {
        $.get('api/resize/' + imageName + '/' + optimizedData.scale,
        function (resizeResult) {
          if (resizeResult.success)
          {
            newImageName = resizeResult.imageName;
          }
          callback(newImageName);
        });
    });
}

function displayImage(imageName)
{
  viewModel.isLoadingImage(true); 
  viewModel.fileName(imageName);
  var $mainImage = $('img#main');
  
  getScreenOptimizedImage(imageName, function(newImageName) {
    $mainImage.attr('src', newImageName).attr('alt', imageName);
    viewModel.imageName(newImageName);
    viewModel.isLoadingImage(false);
  });
}

function preloadImage(imageName, callback)
{
  var imgPreload = new Image();
  $(imgPreload).attr({ src: imageName, alt: imageName });

  // check if the image is already loaded (cached)
  if (imgPreload.complete || imgPreload.readyState === 4) 
  {
    // image loaded
    callback();
  } 
  else 
  {
    // go fetch the image
    $(imgPreload).load(function (response, status, xhr) {
      callback();
    });
  }
}

function displayImageAndComponents(imageName)
{
  displayImage(imageName);
  //getExifInfo(imageName);
}

function updateProgressBar(percent) 
{
    if (percent === 0.0 || percent === 100.0)
    {
        $('#progressBar').hide();
    }
    else
    {
        var progressBarWidth = percent * $(window).width() / 100.0;
        $('#progressBar').animate({ width: progressBarWidth }, 250);
        $('#progressBar').show();
    }
}

function attachFullScreenEvent()
{
    if($.support.fullscreen) 
    {
      $('img#main').click(function() {
        $('#container').fullScreen();
      });
    }
}

function setElementExifData(element, data, pre, post)
{
	if (data)
	{
		element.text(pre + data + post);
		element.show();
	}
	else
	{
		element.hide();
	}
}

function addImageThumbnail(imageName)
{
    $.get('api/thumbnail/' + imageName, function(data) {
        var $thumbnailContainer = $('#thumbnailContainer');
        var newImage = new Image();
        newImage.src = data.thumbName;
        newImage.onload = function() {
          var $img = $('<img></img>').attr('src', data.thumbName).attr('alt', data.thumbName).attr('imageName', imageName).addClass('thumbnail').hide();
          $img.click(thumbnailOnClick);
          var newImageRatio = 64.0 / newImage.height; // thumbnails is 64 pixel high
          var newIamgeWidth = newImageRatio * newImage.width;
          if (($thumbnailContainer.width() + newIamgeWidth) > $(window).width())
          {
            var $firstChild = $thumbnailContainer.children().first();
            var firstChildWidth = $firstChild.width(); 
            $thumbnailContainer.animate({ 'margin-left': -firstChildWidth }, 1000, function() {
                $firstChild.remove();
                $thumbnailContainer.css({ 'margin-left': 0 });
            });
          }
          $thumbnailContainer.append($img);
          $img.fadeIn(1000);
        };
      });
}

function setupSocket() 
{
    var socket = io.connect();
    socket.on('newFile', function(data) {
      if (viewModel.play())
      {
          displayImageAndComponents(data.fileName);
      }
      // next notification is in 5s
      addImageThumbnail(data.fileName);
    });

    socket.on('uploadingImage', function(data) {
        updateProgressBar(data.percent);
    });
}

function setupHistogram()
{
    $('img#his').draggable(
    { 
      containment: "window",
      opacity: 0.4,
      stop: onStopDragHistogram
    });
}

function onStopDragHistogram(event, ui)
{    
    var position = ui.position;
    viewModel.setHistogramPosition(position);
}

function thumbnailOnClick(eventObject)
{
    viewModel.play(false);
    var imageName = eventObject.target.attributes.imageName.value;
    displayImageAndComponents(imageName);
}

function setupThumbnails()
{
    $('#thumbnailContainer > img').on('click', thumbnailOnClick);
}

function initializeSingle(viewModelIn)
{
  viewModel = viewModelIn;
  setupSocket();
  displayImage('eyefi.gif');
  updateProgressBar(0);
  attachFullScreenEvent();
  setupHistogram();
  setupThumbnails();
}
