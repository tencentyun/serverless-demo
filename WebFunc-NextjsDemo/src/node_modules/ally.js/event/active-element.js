'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('../prototype/window.requestanimationframe');

var _window = require('../prototype/window.customevent');

var _window2 = _interopRequireDefault(_window);

var _decorateService = require('../util/decorate-service');

var _decorateService2 = _interopRequireDefault(_decorateService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var previousActiveElement = void 0;
/*
  Debugging tool that observe changes to activeElement regardless of focus/blur events.
  This utility does *not* work with ShadowDOM.

  USAGE:
    engage();
    document.body.addEventListener('active-element', function(event) {
      // event.detail.focus: element that received focus
      // event.detail.blur: element that lost focus
    }, false);

  NOTE: You *can* use event-delegation on focus events by using the capture-phase:
    document.body.addEventListener('focus', function(event) {
      // event.target: element that received focus
      // event.relatedTarget: element that lost focus
    }, true);
*/

var raf = void 0;

function observeActiveElement() {
  if (!document.activeElement) {
    // IE10 does not redirect focus to <body> when the activeElement is removed
    document.body.focus();
  } else if (document.activeElement !== previousActiveElement) {
    // https://developer.mozilla.org/en/docs/Web/API/CustomEvent
    var activeElementEvent = new _window2.default('active-element', {
      bubbles: false,
      cancelable: false,
      detail: {
        focus: document.activeElement,
        blur: previousActiveElement
      }
    });

    document.dispatchEvent(activeElementEvent);
    previousActiveElement = document.activeElement;
  }

  if (raf === false) {
    return;
  }

  raf = requestAnimationFrame(observeActiveElement);
}

function engage() {
  raf = true;
  previousActiveElement = document.activeElement;
  observeActiveElement();
}

function disengage() {
  cancelAnimationFrame(raf);
  raf = false;
}

exports.default = (0, _decorateService2.default)({ engage: engage, disengage: disengage });
module.exports = exports['default'];
//# sourceMappingURL=active-element.js.map