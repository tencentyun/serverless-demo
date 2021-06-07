
// determine if an element's tabindex attribute has a valid value

import contextToElement from '../util/context-to-element';
import _supports from '../supports/supports';
var supports = void 0;

// https://www.w3.org/TR/html5/infrastructure.html#rules-for-parsing-integers
// NOTE: all browsers agree to allow trailing spaces as well
var validIntegerPatternNoTrailing = /^\s*(-|\+)?[0-9]+\s*$/;
var validIntegerPatternWithTrailing = /^\s*(-|\+)?[0-9]+.*$/;

export default function (context) {
  if (!supports) {
    supports = _supports();
  }

  var validIntegerPattern = supports.focusTabindexTrailingCharacters ? validIntegerPatternWithTrailing : validIntegerPatternNoTrailing;

  var element = contextToElement({
    label: 'is/valid-tabindex',
    resolveDocument: true,
    context: context
  });

  // Edge 14 has a capitalization problem on SVG elements,
  // see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9282058/
  var hasTabindex = element.hasAttribute('tabindex');
  var hasTabIndex = element.hasAttribute('tabIndex');

  if (!hasTabindex && !hasTabIndex) {
    return false;
  }

  // older Firefox and Internet Explorer don't support tabindex on SVG elements
  var isSvgElement = element.ownerSVGElement || element.nodeName.toLowerCase() === 'svg';
  if (isSvgElement && !supports.focusSvgTabindexAttribute) {
    return false;
  }

  // @browser-issue Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
  if (supports.focusInvalidTabindex) {
    return true;
  }

  // an element matches the tabindex selector even if its value is invalid
  var tabindex = element.getAttribute(hasTabindex ? 'tabindex' : 'tabIndex');
  // IE11 parses tabindex="" as the value "-32768"
  // @browser-issue Trident https://connect.microsoft.com/IE/feedback/details/1072965
  if (tabindex === '-32768') {
    return false;
  }

  return Boolean(tabindex && validIntegerPattern.test(tabindex));
}
//# sourceMappingURL=valid-tabindex.js.map