var playbackState = 'play';
var checkQueueTimeout = 500;
var viewModel;

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

function addImageThumbnail(fName)
{
    $.get('api/thumbnail/' + fName, function(data) {
        var $thumbnailContainer = $('#thumbnailContainer');
        var newImage = new Image();
        newImage.src = data.thumbName;
        newImage.onload = function() {
          var $img = $('<img></img>').attr('src', data.thumbName).attr('alt', data.thumbName).attr('fileName', fName).addClass('thumbnail').hide();
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
        viewModel.displayImage(data.fileName, true);
      }
      // next notification is in 5s
      addImageThumbnail(data.fileName);
    });

    socket.on('uploadingImage', function (data) {
      viewModel.eyefiUploadProgressPercent(data.percent);
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
    var fName = eventObject.target.attributes.fileName.value;
    viewModel.displayImage(fName, true);
}

function setupThumbnails()
{
    $('#thumbnailContainer > img').on('click', thumbnailOnClick);
}

function initializeSingle(viewModelIn)
{
  viewModel = viewModelIn;
  setupSocket();
  viewModel.displayImage('eyefi.gif', false);
  attachFullScreenEvent();
  setupHistogram();
  setupThumbnails();
}
