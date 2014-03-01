var ViewModel = function() {
  var self = this;
  this.fileName = ko.observable('');
  this.imageName = ko.observable('');
  this.histogramImageName = ko.observable('');
  this.isLoadingImage = ko.observable(false);
  this.play = ko.observable(true);
  this.histogramState = ko.observable({ enabled: false, position: { top: 36, left: 4 }});
  this.histogramSize = { width: 256, height: 158 };
  

  this.exifArray = ko.observableArray();
  this.readyQueueNames = ko.observableArray();
  this.processQueueNames = ko.observableArray();
  this.processingNames = ko.observableArray();

  this.processQueueNamesVisible = ko.observable(false);
  this.readyQueueNamesVisible = ko.observable(false);
  this.processingNamesVisible = ko.observable(false);
    
  this.togglePlayback = function() {
    self.play(!self.play());
  }

  this.playButtonIcon = ko.computed(function() {
    // if we're paused, show play icon
    if (!self.play())
    {
      return 'play.png';
    }
    
    // otherwise show pause icon
    return 'pause.png';
  }, this);
  this.playButtonAlt = ko.computed(function() {
    // if we're paused, icon alt should say click to play
    if (!self.play())
    {
      return 'play';
    }
    
    // otherwise say click to pause
    return 'pause';
  }, this);
  

  this.displayName = ko.computed(function() {
    if (self.isLoadingImage()) 
    {
      return self.fileName() + ' loading ... ';
    }
    
    if (self.imageName())
    {
      return self.imageName();
    }
      
    return self.fileName();
  }, this);

  this.computeExifArray = ko.computed(function() {
    if (self.fileName)
    {
      $.get('api/exifall/' + self.fileName, function(exifData) {
        self.setExifArray(exifData);
      });
    }
  }, this);

  this.setExifArray = function(exifData)
  {
    self.exifArray.removeAll();
    if (exifData)
    {
      // ISO
      if (exifData.iso)
      {
        self.exifArray.push('ISO' + exifData.iso);
      }
      // aperture
      if (exifData.aperture)
      {
        self.exifArray.push('f' + exifData.aperture);
      }
      // focal length
      if (exifData['focal length'])
      {
        var focalLength = exifData['focal length'];    
        self.exifArray.push(focalLength.substr(0, focalLength.indexOf(' ')) + 'mm');
      }
      if (exifData['shutter speed'])
      {
        // shutter speed
        self.exifArray.push(exifData['shutter speed'] + 's');
      }
    }
  }

  this.loadHistogramState = function() {
    var stateStr = localStorage.getItem('nev.histogram');
    if (stateStr !== null)
    {
      var state = JSON.parse(stateStr);

      var $win = $(window);

      if ((state.position.left + self.histogramSize.width) > $win.width())
      {
          state.position.left = $win.width - self.histogramSize.width;
      }

      if ((state.position.top + self.histogramSize.height) > $win.height())
      {
          state.position.top = $win.height() - self.histogramSize.height;
      }

      self.histogramState(state);
    }
  };
  // load the state in constructor
  this.loadHistogramState();
  
  this.saveHistogramState = function() {
    localStorage.setItem('nev.histogram', JSON.stringify(self.histogramState()));
  }

  this.setHistogramPosition = function(newPosition)
  {
    self.histogramState(
    { 
      enabled: self.histogramState().enabled, 
      position: newPosition
    });
    self.saveHistogramState();
  }

  this.toggleHistogramEnabled = function() {
    var state = self.histogramState();
    state.enabled = !state.enabled;
    self.histogramState(state);
  };

  this.getHistogramImageName = ko.computed(function() {
    if (self.histogramState().enabled && self.fileName() && self.fileName().length > 0)
    {
      $.get('api/histogram/' + self.fileName(), function(data) {
        if (data && data.histogramName && data.histogramName.length > 0)
        {
          self.histogramImageName(data.histogramName);
        }
      });
    }
  }, this);

  this.isHistogramVisible = ko.computed(function() {
    if (self.fileName() === null || self.fileName() === '' || self.histogramImageName() === null || self.histogramImageName() === '')
    {
      return false;
    }
    return self.histogramState().enabled;
  });

  this.histogramLeft = ko.computed(function() {
    return self.histogramState().position.left + "px";
  }, this);

  this.histogramTop = ko.computed(function() {
    return self.histogramState().position.top + "px";
  }, this);

  this.isResetHistogramVisible = ko.computed(function() {
    if (!self.isHistogramVisible())
    {
      return false;
    }

    if (self.histogramState().position.left != 4)
    {
      return true;
    }

    if (self.histogramState().position.top != 36)
    {
      return true;
    }

    return false;
  }, this);

  this.resetHistogramPosition = function() {
    self.setHistogramPosition({ left: 4, top: 36 });
  };

  this.setQueueArrays = function() {
    $.get('api/queue?namesOnly', function(queues) {
        self.readyQueueNames.removeAll();
        var rl = queues.readyQueue.length;
        for (var r = 0; r < rl; r++) 
        {
          self.readyQueueNames.push(queues.readyQueue[r]);
        }
        self.readyQueueNamesVisible(self.readyQueueNames().length > 0);

        self.processQueueNames.removeAll();
        var pl = queues.processQueue.length;
        for (var p = 0; p < pl; ++p)
        {
          self.processQueueNames.push(queues.processQueue[p]);
        }
        self.processQueueNamesVisible(self.processQueueNames().length > 0);

        self.processingNames.removeAll();
        var ql = queues.processingImages.length;
        for (var q = 0; q < ql; ++q)
        {
          self.processingNames.push(queues.processingImages[q]);
        }
        self.processingNamesVisible(self.processingNames().length > 0);

     });
  }  

  setInterval(this.setQueueArrays, 1000);
}