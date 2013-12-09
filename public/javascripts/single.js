function loadImage(imageName)
{
    $('#main').attr('src', imageName).attr('alt', imageName);
    $('#imageName').text(imageName);
}
      
function loadHistogram(hisImageName)
{
    var hisVisibleStr = localStorage.getItem('nev.histogram.visible');
    var hisVisible = true;
    if (hisVisibleStr != null)
    {
        hisVisible = JSON.parse(hisVisibleStr);
    }

    if (hisImageName == '')
    {
        $('#his').hide();
    }
    else
    {
        $('#his').attr('src', hisImageName).attr('alt', hisImageName);
        if (hisVisible)
        {
            $('#his').show();
            $('#toggleHisButton').css('background-color', 'rgba(255, 255, 255, 0.20)');
        }
        else
        {
            $('#toggleHisButton').css('background-color', 'rgba(0, 0, 0, 0.25)');
        }
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
if (qLength == 0)
{
    $('#queueLength.exifBox').hide();
}
else
{
    $('#queueLength.exifBox').text('Queue: ' + qLength).show();
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

function getHistogram(fileName)
{
    $.get('api/histogram/' + fileName, function(data) {
        loadHistogram(data.histogramName);
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
    $('#resetHisButton').click(resetHistogramPosition);
    $('#toggleHisButton').click(toggleHistogram);
    loadHistogramPosition();
}

function toggleHistogram()
{
    var hisVisibleStr = localStorage.getItem('nev.histogram.visible');
    var hisVisible = true;
    if (hisVisibleStr != null)
    {
        hisVisible = JSON.parse(hisVisibleStr);
    }

    hisVisible = !hisVisible;
    localStorage.setItem('nev.histogram.visible', hisVisible);
    if (!hisVisible)
    {
        $('img#his').hide('slow');
        $('#toggleHisButton').css('background-color', 'rgba(0, 0, 0, 0.25)');
    }
    else
    {
        $('img#his').show('slow');
        $('#toggleHisButton').css('background-color', 'rgba(255, 255, 255, 0.20)');
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
    loadHistogram('');
    updateProgressBar(0);
    attachFullScreenEvent();
    setInterval(checkQueue, 3000);
    setupHistogram();
    
}
