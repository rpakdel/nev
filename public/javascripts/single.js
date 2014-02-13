var playbackState = 'play';
var checkQueueTimeout = 500;
var viewModel;

var shouldShowLoadingImage = false;
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
  shouldShowLoadingImage = true;
  setTimeout(showLoadingImage, 500);
  viewModel.fileName(imageName);
  viewModel.isLoadingImage (true);
  var $mainImage = $('img#main');
  
  getScreenOptimizedImage(imageName, function(newImageName) {
    $mainImage.attr('src', newImageName).attr('alt', imageName);
    shouldShowLoadingImage = false;
    $('img#loading').hide();
    viewModel.imageName(newImageName);
    viewModel.isLoadingImage(false);    
    if (playbackState == 'play')
    {
      updateQueueStatus();
      setTimeout(updateQueueStatus, checkQueueTimeout);
    }
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

function showLoadingImage()
{
  if (shouldShowLoadingImage)
  {
    $('img#loading').show();
  }
}

function displayImageAndComponents(imageName)
{
  displayImage(imageName);
  getExifInfo(imageName);
  getHistogram(imageName);
}

function getIsHistogramEnabled()
{
    var hisVisibleStr = localStorage.getItem('nev.histogram.enable');
    var hisVisible = true;
    if (hisVisibleStr !== null)
    {
        hisVisible = JSON.parse(hisVisibleStr);
    }
    return hisVisible;
}

function setIsHistogramEnabled(isEnabled)
{
    localStorage.setItem('nev.histogram.enable', isEnabled);
}

function displayHistogramImage(hisImageName)
{
    if (hisImageName === null || hisImageName === '')
    {
        showHideHistogram(false);
    }
    else
    {
        var isEnabled = getIsHistogramEnabled();
        $('#his').attr('src', hisImageName).attr('alt', hisImageName);
        showHideHistogram(isEnabled);
    }
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

function setQueueStatus(queueStatus)
{
  var $queueLen = $('#queueLen');
  $queueLen.text('P:' + queueStatus.processQueueLength + " R:" + queueStatus.readyQueueLength );
  $queueLen.toggleClass('processing', queueStatus.processing);
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

function getExifInfo(fileName)
{
    $.get('api/exifall/' + fileName, function(exifData) {
        viewModel.setExifArray(exifData);
    });
}

var histogramFileName = null;
function getHistogram(fileName)
{
    histogramFileName = fileName;
    if (!getIsHistogramEnabled())
    {
        return;
    }    
    displayHistogramImage('histogram-loading.gif');
    $.get('api/histogram/' + fileName, function(data) {
        displayHistogramImage(data.histogramName);        
    });
}

function updateQueueStatus()
{
    $.get('api/queueStatus', setQueueStatus);
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
      if (playbackState != "pause")
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
    $('#resetHistogramButton').click(resetHistogramPosition);
    $('#toggleHistogramButton').click(toggleHistogram);
    loadHistogramPosition();
}

function toggleHistogram()
{
    var isEnabled = getIsHistogramEnabled();
    isEnabled = !isEnabled;
    setIsHistogramEnabled(isEnabled);
    
    if (isEnabled && histogramFileName !== null)
    {
      // load and show the image
      getHistogram(histogramFileName);
    }
    else
    {
        showHideHistogram(isEnabled);    
    }    
}

function showHideHistogram(show)
{
    if (show)
    {       
        $('img#his').show('slow');
        $('#toggleHistogramImg').attr('buttonEnabled', true);
        $('#resetHistogramButton').show();
    }
    else
    {
        $('img#his').hide('slow');
        $('#toggleHistogramImg').attr('buttonEnabled', false);
        $('#resetHistogramButton').hide();
    }
}

function onStopDragHistogram(event, ui)
{    
    var position = ui.position;
    localStorage.setItem('nev.histogram.position', JSON.stringify(position));
}

function loadHistogramPosition()
{
    var position = JSON.parse(localStorage.getItem('nev.histogram.position'));

    if (position !== null)
    {
        var $imghis =  $('img#his');
        var $win = $(window);

        if ((position.left + $imghis.width()) > $win.width())
        {
            position.left = $win.width - $imghis.width();
        }
        if ((position.top + $imghis.height()) > $win.height())
        {
            position.top = $win.height() - $imghis.height();
        }

        $imghis.css({
            left: + position.left,
            top: position.top
        });
    }
}

function resetHistogramPosition()
{
  localStorage.removeItem('nev.histogram.position');
  $('img#his').css({
      right:'4px',
      bottom:'4px'
  });
}

function thumbnailOnClick(eventObject)
{
    playbackState = "pause";
    showPlaybackButton();
    var imageName = eventObject.target.attributes.imageName.value;
    displayImageAndComponents(imageName);
}

function setupThumbnails()
{
    $('#thumbnailContainer > img').on('click', thumbnailOnClick);
}

function showPlaybackButton()
{
    if (playbackState == 'play')
    {
        //$('#timerBar').show();
        $('img#toggleAutoplayImg').attr('src', 'pause.png').attr('alt', 'pause');
    }
    else
    {
        //$('#timerBar').hide();
        $('img#toggleAutoplayImg').attr('src', 'play.png').attr('alt', 'play');
    }
}

function toggleAutoplay()
{
    if (playbackState == 'play')
    {
        playbackState = 'pause';
    }
    else
    {
        playbackState = 'play';
        updateQueueStatus();
    }
    showPlaybackButton();
}

function setupAutoplay()
{
  $('#toggleAutoplayButton').click(toggleAutoplay);
}

function setupDemo(showRunDemoButton)
{
    $('#demoButton').click(function() {
      $.get('api/pushExamples', function() {
        updateQueueStatus(); 
      });
    });
}

function initializeSingle(showRunDemoButton, viewModelIn)
{
  viewModel = viewModelIn;
  setupSocket();
  displayImage('eyefi.gif');
  displayHistogramImage(null);
  updateProgressBar(0);
  attachFullScreenEvent();
  setupAutoplay();
  setupDemo(showRunDemoButton);
  setupHistogram();
  setupThumbnails();
}
