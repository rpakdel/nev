node-eyefi-viewer
=================

A Node.js based server and viewer for the Eye-Fi Wifi cards.

Notes
=====

- After running the Node app, open a browser to <server_ip>:8080.
- Pretty rough code as I'm learning Node and Javascript.
- Only .JPG images are supported (see https://github.com/usefulthink/node-eyefi for more information).
- Make sure the Eye-Fi centre app is not running.
- I don't recommend using the uploaded images. Attach the card to your computer and upload the images directly.

Installation
============

- Follow the Preparation section of https://github.com/usefulthink/node-eyefi
- setup your card key in mycards.js
- Install GraphicsMagick and ensure it is available on the PATH
- Install ExifTool (http://www.sno.phy.queensu.ca/~phil/exiftool/) and ensure it is available on the PATH (exiftool.exe). 

TODO
====

- Add support for multiple sizes because resizing large images in browser is slow on mobile devices.
- If a request for histogram or thumbnail or optimized size are made while we're generating the histogram, 
  thumbnail or smller image, a duplicate request for the thumbnail, histogram or optimized image is made.
- Front-end timing is off (green progress bar).