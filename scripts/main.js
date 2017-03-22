// Adding services/utils in one file for easier reading instead of requiring multiple modules and a build process.

var App = (function () {
  // Data object stores all variables and settings.

  var data = {
    resultsContainer: document.querySelector('.search-results-container'),
    modal: document.querySelector('.lightbox-modal'),
    searchForm: document.querySelector('.search-form'),
    searchInput: document.querySelector('.search-input'),
    thumbContainerClass: 'result-thumb-container',
    thumbnailClass: 'result-thumb',
    loadingClass: 'loading',
    flickrUrl: 'https://api.flickr.com/services/rest/',
    flickrOpts: {
      method: 'flickr.photos.search',
      api_key: '663f360a4de67ec7859b538bdae80537',
      per_page: 25,
      page: 1, // #NOTE: Hardcoded page, but if we added pagination we would want to make this dynamic.
      format: 'json',
      sort: 'relevance',
      nojsoncallback: 1
    },
    response: null
  };

  function init () {
    // Methods needed to be executed upon completion of DOM.

    _bindEvents();
    Modal.init();
  }

  function _bindEvents () {
    data.searchForm.addEventListener('submit', _getResults);
    data.resultsContainer.addEventListener('click', _handleContainerClick);
  }

  function _handleContainerClick (e) {
    var element = e.target;

    if (element.className === data.thumbnailClass) {
      // If thumbnail clicked, call modal.open with the index of the image

      Modal.openModal(data.response.photos.photo[element.dataset.index]);
    }
  }

  function _getResults (e) {
    var query = data.searchInput.value;
    e.preventDefault();

    if (query.length > 0) {
      // Make AJAX call only if query is passed in.

      data.searchForm.classList.add(data.loadingClass);
      getJSON(_createRequestUrl(query), _renderResults, _renderNoResults);
    }
  }

  function _createRequestUrl (query) {
    var opts = data.flickrOpts;
    opts['text'] = query;

    return data.flickrUrl + '?' + parameterize(opts);
  }

  function _createFlickrLink (item, type) {
    // Manually generate link since API doesn't return a proper link in the response.
    // If the type param is passed in as thumb, change url appropriately.

    var sizeParam = (type === 'thumb') ? '_q' : '';

    return 'https://farm' + item['farm'] + '.staticflickr.com/' + item['server'] + '/' + item['id'] + '_' + item['secret'] + sizeParam + '.jpg';
  }

  function _renderResults (response) {
    var fragment = document.createDocumentFragment();
    var container = data.resultsContainer;
    var photos = response.photos.photo;

    data.searchForm.classList.remove(data.loadingClass); // Remove loading on XHR complete.
    container.innerHTML = ''; // Reset inner html to render new results.

    if (photos.length === 0) {
      _renderNoResults();
    } else {
      data.response = response; // Cache response
      photos.map( function (item, i) {
        // Use map for closure to properly attach onload events.

        var element, img;

        // Shim API response here to save looping through object again.

        item.thumbSrc = _createFlickrLink(item, 'thumb');
        item.src = _createFlickrLink(item);
        item.index = i;

        element = document.createElement('div');
        img = document.createElement('img');

        element.className = data.thumbContainerClass;
        img.src = item['thumbSrc'];
        img.alt = item['title'];
        img.classList.add(data.thumbnailClass, data.loadingClass);
        img.addEventListener('load', function () {
          img.classList.remove(data.loadingClass);
        });
        img.dataset.index = i; // Save index for image data retrieval.

        element.appendChild(img);
        fragment.appendChild(element);
      });

      container.appendChild(fragment);
    }
  }

  function _renderNoResults () {
    data.searchForm.classList.remove(data.loadingClass); // Remove loading on XHR complete.
    data.resultsContainer.innerText = 'No Results Found';
  }

  /*
   * Modal class
   * Methods: init - Initializes the modal
   *          openModal - Opens the modal
   *          closeModal - Closes the modal
   *          stepForward - Goes to the next image
   *          stepBackward - Goes to previous image
   */

  var Modal = ( function () {
    var modal = data.modal;
    var modalContainer = modal.parentElement;
    var modalOverlay = modalContainer.querySelector('.lightbox-modal-overlay');
    var modalHeader = modal.querySelector('.modal-header');
    var modalImg = modal.querySelector('.modal-image');
    var modalNext = modal.querySelector('.modal-next');
    var modalPrev = modal.querySelector('.modal-prev');
    var modalClose = modal.querySelector('.modal-close');
    var keyCodes = {
          esc: 27,
          right: 39,
          left: 37
        };

    function init () {
      _bindEvents();
    }

    function _bindEvents () {
      modalClose.addEventListener('click', close);
      modalOverlay.addEventListener('click', close);
      modalNext.addEventListener('click', stepForward);
      modalPrev.addEventListener('click', stepBackward);
      document.addEventListener('keyup', _handleKeyPress);
    }

    function _handleKeyPress (e) {
      var key = e.keyCode;

      if (modalContainer.classList.contains('modal-visible') === true) {
        // Ensure modal is open before doing anything.

        switch (key) {
          case keyCodes['esc']:
            close();
            break;
          case keyCodes['left']:
            stepBackward();
            break;
          case keyCodes['right']:
            stepForward();
            break;
        }
      }

    }

    function _updateModal (item) {
      modalHeader.innerText = item['title'];
      modalImg.src = item['src'];
      modalImg.alt = item['title'];
      modalImg.dataset.index = item['index'];
    }

    function open (item) {
      _updateModal(item);
      modalContainer.classList.add('modal-visible');
    }

    function close () {
      modalContainer.classList.remove('modal-visible');
    }

    function stepForward () {
      var photos = data.response.photos.photo,
          index = parseInt(modalImg.dataset.index, 10),
          newIndex = index + 1 < photos.length ? index + 1 : 0; // If at last item, start over at 0

      _updateModal(photos[newIndex]);
    }

    function stepBackward () {
      var photos = data.response.photos.photo;
      var index = parseInt(modalImg.dataset.index, 10);
      var newIndex = index - 1 < 0 ? photos.length - 1 : index - 1; // If at first item, start at last

      _updateModal(photos[newIndex]);
    }

    return {
      init: init,
      openModal: open,
      closeModal: close,
      stepForward: stepForward,
      stepBackward: stepBackward
    };
  })();

  /*
   * XHR Request helper
   * Required: URL
   * Optional: Params - parameters for call.
   *           successCallback - Callback for successful call.
   *           errorCallback - Callback for error.
   */

  function getJSON (url, successCallback, errorCallback) {
    if (!url) {
      throw new Error('URL is required for ajax call');
    }

    var method = 'GET';
    var xhr = new XMLHttpRequest();
    var async = true;

    xhr.open(method, url, async);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 400) {
        // Success
        successCallback(JSON.parse(xhr.responseText));
      } else {
        // Error
        errorCallback({
          status: xhr.status,
          error: xhr.statusText
        });
      }
    }
    xhr.onerror = errorCallback;
    xhr.send();
  }

  /*
   * Parameter Helper
   * Takes an object and serializes it into a query string.
   */

   function parameterize (object) {
    return Object.keys(object).map(function (item) {
      return item + '=' + object[item]
    }).join('&');
  }

  return {
    init: init,
    Modal: Modal,
    getJSON: getJSON
  }

})();

document.addEventListener('DOMContentLoaded', App.init);
