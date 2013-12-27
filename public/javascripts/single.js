var playbackState = 'play';
var checkQueueTimeout = 4000;
var serverQueueTimeout = 5000;

var shouldShowLoadingImage = false;
function loadImage(imageName)
{
  shouldShowLoadingImage = true;
  setTimeout(showLoadingImage, 500);
  $('#imageName').text(imageName);
  var $mainImage = $('img#main');
  var img = new Image();
  img.src = imageName;
  img.onload = function() {
    $mainImage.attr('src', imageName).attr('alt', imageName);
    shouldShowLoadingImage = false;
    $('img#loading').hide();
    if (playbackState == 'play')
    {
        setTimeout(checkQueue, checkQueueTimeout);
    }
  };
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
  loadImage(imageName);
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

function timerDecrement()
{
    if (playbackState == 'pause')
    {
        return;
    }

    serverQueueTimeout = serverQueueTimeout - 510;
    if (serverQueueTimeout < 0)
    {
        serverQueueTimeout = 0;
    }
    var percent = serverQueueTimeout * 100.0/ 5000.0;
    var timerBarWidth = percent * $(window).width() / 100.0;
    $('#timerBar').animate({ width: timerBarWidth }, 250);
}

function queueUpdated(qLength)
{
    $('#queueLen').text('Q:' + qLength);
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
      
function setExifInfo(exifData)
{
    setElementExifData($('#exifISO'), exifData.iso, 'ISO', '');
    setElementExifData($('#exifAperture'), exifData.aperture, 'f', '');
    setElementExifData($('#exifShutterSpeed'), exifData.shutterSpeed, '', 's');
    setElementExifData($('#exifFocalLength'), exifData.focalLength, '', 'mm');        
}

function getExifInfo(fileName)
{
    $.get('api/exif/' + fileName, function(exifData) {
        setExifInfo(exifData);
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

function checkQueue()
{
    $.get('api/queuesize', function(data) {
        queueUpdated(data.length);
    });
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
    var socket = io.connect('#{serverIp}');
    socket.on('newFile', function(data) {
      if (playbackState != "pause")
      {
          displayImageAndComponents(data.fileName);
      }
      // next notification is in 5s
      serverQueueTimeout = 5000;
      addImageThumbnail(data.fileName);      
    });

    socket.on('uploadingImage', function(data) {
        updateProgressBar(data.percent);
    });

    socket.on('queueUpdated', function(data) {
        queueUpdated(data.queueLength);
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
        $('#timerBar').show();
        $('img#toggleAutoplayImg').attr('src', 'pause.png').attr('alt', 'pause');
    }
    else
    {
        $('#timerBar').hide();
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
        checkQueue();
    }
    showPlaybackButton();
}

function setupAutoplay()
{
    $('#toggleAutoplayButton').click(toggleAutoplay);
}

function initializeSingle()
{
    //localStorage.removeItem('nev.histogram.visible');
    setupSocket();
    loadImage('eyefi.gif');
    displayHistogramImage(null);
    updateProgressBar(0);
    attachFullScreenEvent();
    setInterval(timerDecrement, 260);
    setupAutoplay();
    setupHistogram();
    setupThumbnails();
}
