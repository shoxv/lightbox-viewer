Lightbox Viewer
============
### Description

A simple responsive lightbox viewer built without any libraries. The app is connected with the [Flickr API](https://www.flickr.com/services/api/) and displays the first 25 results by relevance returned for the entered search term.

### Instructions

1. Open index.html.
2. Type a name or topic into the search box.
3. Click on a thumbnail to see an enlarged version of the image.
4. Click the buttons to navigate between images and close the modal, or use the following keysboard keys:
  - Left arrow to go back
  - Right arrow to go forward
  - Escape to close the modal


### Development

Uses [semistandard](https://github.com/Flet/semistandard) to enforce style. Semistandard is [standard](https://github.com/feross/standard), a unified set of JS style rules, but with semicolons.

1. `git clone https://github.com/shoxv/lightbox-viewer.git`
2. `cd lightbox-viewer`
3. `npm install`

To lint: `semistandard` in the `lightbox-viewer` directory.