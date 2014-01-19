node-eyefi-viewer
=================

A Node.js based server and viewer for the Eye-Fi Wifi cards.

Features
========

- Creates smaller images when received from Eye-Fi card for smaller screen devices
- Provides EXIF
- Optionally shows histogram (can be placed anywhere on screen)
- Has rolling thumbnails of recently uploaded images

Notes
=====

- Pretty rough code as I'm learning Node and Javascript.
- Uses node-eyefi for receiving images (see https://github.com/usefulthink/node-eyefi for more information).
- Make sure the Eye-Fi centre app is not running.
- I don't recommend using the uploaded images. Attach the card to your computer and upload the images directly.

Requirements
============

- Node.js (http://nodejs.org). Ensure it is available on the Path.
- GraphicsMagick (http://www.graphicsmagick.org).  Ensure it is available on the PATH.
- ExifTool (http://www.sno.phy.queensu.ca/~phil/exiftool). Ensure it is available on the PATH (rename to exiftool.exe). 

Installation and Running
========================

- Install required software.
- Run npm install to obtain additional packages needed.
- Follow the Preparation section of https://github.com/usefulthink/node-eyefi
- Setup your card key in mycards.js.
- run node app.js.
- Open a browser to <server_ip>:8080.


TODO
====

- Fix the reset button for re-positioning the histogram.
- Properly resize portrait images on client side (fix the css).
- Create standalone app (Node webkit?).
- Delete the log files created when images are uploaded.
- Support RAW and video for the Pro cards.