function loadImage(imageName)
{
    $('#main').attr('src', imageName).attr('alt', imageName);
    $('#imageName').text(imageName);
}
      
function loadHistogram(hisImageName)
{
    if (hisImageName == '')
    {
        $('#his').hide();
    }
    else
    {
        $('#his').attr('src', hisImageName).attr('alt', hisImageName);
        $('#his').show();
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
    var progressBarWidth = percent * $('#progressBar').width() / 100.0;
    $('#progressBarDiv').animate({ width: progressBarWidth }, 100);
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
    $('#container').click(function(e) {
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
      
function setupSocket() 
{
    var socket = io.connect('#{serverIp}');
    socket.on('newFile', function(data) {
        loadImage(data.fileName);
        setExifInfo(data.exifData);
        loadHistogram(data.histogramName);
    });

    socket.on('uploadingImage', function(data) {
        updateProgressBar(data.percent);
    });

    socket.on('queueUpdated', function(data) {
        queueUpdated(data.queueLength);
    });
}

function initializeSingle()
{
    setupSocket();
        loadImage('eyefi.gif');
        loadHistogram('');
        updateProgressBar(0.0);
        attachFullScreenEvent();
}