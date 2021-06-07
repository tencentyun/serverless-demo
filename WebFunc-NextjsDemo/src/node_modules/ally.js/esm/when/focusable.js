
/*
  trigger a callback once the context element is focusable and is fully visible in the viewport
*/

import whenVisibleArea from './visible-area';
import isFocusable from '../is/focusable';
import contextToElement from '../util/context-to-element';
import getDocument from '../util/get-document';

export default function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      callback = _ref.callback,
      area = _ref.area;

  if (typeof callback !== 'function') {
    throw new TypeError('when/focusable requires options.callback to be a function');
  }

  var element = contextToElement({
    label: 'when/focusable',
    context: context
  });

  var filterCallback = function filterCallback(target) {
    if (!isFocusable(target)) {
      return false;
    }

    return callback(target);
  };

  var _document = getDocument(element);
  var handle = whenVisibleArea({ context: element, callback: filterCallback, area: area });
  var disengage = function disengage() {
    _document.removeEventListener('focus', disengage, true);
    handle && handle.disengage();
  };

  _document.addEventListener('focus', disengage, true);

  return { disengage: disengage };
}
//# sourceMappingURL=focusable.js.map