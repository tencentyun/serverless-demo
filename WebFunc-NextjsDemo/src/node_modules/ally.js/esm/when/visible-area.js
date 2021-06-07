
/*
  execute a callback once an element became fully visible in the viewport
*/

import '../prototype/window.requestanimationframe';
import isVisible from '../is/visible';
import visibleArea from '../util/visible-area';
import contextToElement from '../util/context-to-element';

export default function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      callback = _ref.callback,
      area = _ref.area;

  if (typeof callback !== 'function') {
    throw new TypeError('when/visible-area requires options.callback to be a function');
  }

  if (typeof area !== 'number') {
    area = 1;
  }

  var element = contextToElement({
    label: 'when/visible-area',
    context: context
  });

  var raf = void 0;
  var evaluate = null;
  var disengage = function disengage() {
    raf && cancelAnimationFrame(raf);
  };

  var predicate = function predicate() {
    return !isVisible(element) || visibleArea(element) < area || callback(element) === false;
  };

  var checkPredicate = function checkPredicate() {
    if (predicate()) {
      evaluate();
      return;
    }

    disengage();
  };

  evaluate = function evaluate() {
    raf = requestAnimationFrame(checkPredicate);
  };

  evaluate();
  return { disengage: disengage };
}
//# sourceMappingURL=visible-area.js.map