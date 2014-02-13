var ViewModel = function() {
  var self = this;
  this.fileName = ko.observable();
  this.imageName = ko.observable();
  this.isLoadingImage = ko.observable(false);

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
  });

  this.computeExifArray = ko.computed(function() {
    if (self.fileName)
    {
      $.get('api/exifall/' + self.fileName, function(exifData) {
        self.setExifArray(exifData);
      });
    }
  });

  this.exifArray = ko.observableArray();

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

}