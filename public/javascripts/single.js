function loadImage(imageName)
{
    $('#main').attr('src', imageName).attr('alt', imageName);
    $('#imageName').text(imageName);
}

function getIsHistogramEnabled()
{
    var hisVisibleStr = localStorage.getItem('nev.histogram.enable');
    var hisVisible = true;
    if (hisVisibleStr != null)
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
    if (hisImageName == null || hisImageName == '')
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
    if (percent == 0.0 || percent == 100.0)
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
    displayHistogramImage('loading.png');
    $.get('api/histogram/' + fileName, function(data) {
        displayHistogramImage(data.histogramName);
    });
}

function checkQueue()
{
    $.get('api/queue', function(data) {
        queueUpdated(data.length);
    });
}

function setupSocket() 
{
    var socket = io.connect('#{serverIp}');
    socket.on('newFile', function(data) {
        loadImage(data.fileName);
        getExifInfo(data.fileName);
        getHistogram(data.fileName);
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
    
    if (isEnabled && histogramFileName != null)
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

function initializeSingle()
{
    //localStorage.removeItem('nev.histogram.visible');
    setupSocket();
    loadImage('eyefi.gif');
    displayHistogramImage(null);
    updateProgressBar(0);
    attachFullScreenEvent();
    setInterval(checkQueue, 3000);
    setupHistogram();
    
}
