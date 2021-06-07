
// wrapper for HTMLElement.prototype.focus

import focusSvgForeignObjectHack from './focus.svg-foreign-object-hack';
import getFocusTarget from '../get/focus-target';
import isActiveElement from '../is/active-element';
import isFocusable from '../is/focusable';
import contextToElement from '../util/context-to-element';
import getWindow from '../util/get-window';
import resetScrolling from '../util/reset-scrolling';

function focus(element) {
  if (element.focus) {
    element.focus();
    return isActiveElement(element) ? element : null;
  }

  var _window = getWindow(element);

  try {
    // The element itself does not have a focus method.
    // This is true for SVG elements in Firefox and IE,
    // as well as MathML elements in every browser.
    // IE9 - 11 will let us abuse HTMLElement's focus method,
    // Firefox and Edge will throw an error.
    _window.HTMLElement.prototype.focus.call(element);
    return isActiveElement(element) ? element : null;
  } catch (e) {
    var actionPerformed = focusSvgForeignObjectHack(element);
    return actionPerformed && isActiveElement(element) ? element : null;
  }
}

var except = {
  // exclude elements affected by the IE flexbox bug
  flexbox: true,
  // exclude overflowing elements that are not intentionally
  // made focusable by adding a tabindex attribute
  scrollable: true,
  // include elements that don't have a focus() method
  onlyTabbable: true
};

export default function (context) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      defaultToAncestor = _ref.defaultToAncestor,
      undoScrolling = _ref.undoScrolling;

  var element = contextToElement({
    label: 'element/focus',
    context: context
  });

  var targetIsFocusable = isFocusable.rules({
    context: element,
    except: except
  });

  if (!defaultToAncestor && !targetIsFocusable) {
    return null;
  }

  var target = getFocusTarget({
    context: element,
    except: except
  });

  if (!target) {
    return null;
  }

  if (isActiveElement(target)) {
    return target;
  }

  var _undoScrolling = void 0;
  if (undoScrolling) {
    _undoScrolling = resetScrolling(target);
  }

  var result = focus(target);

  _undoScrolling && _undoScrolling();

  return result;
}
//# sourceMappingURL=focus.js.map