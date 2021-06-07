
import isActiveElement from '../is/active-element';
import queryTabsequence from '../query/tabsequence';
import whenKey from '../when/key';

export default function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context;

  if (!context) {
    context = document.documentElement;
  }

  // Make sure the supports tests are run before intercepting the Tab key,
  // or IE10 and IE11 will fail to process the first Tab key event. Not
  // limiting this warm-up to IE because it may be a problem elsewhere, too.
  queryTabsequence();

  return whenKey({
    // Safari on OSX may require ALT+TAB to reach links,
    // see https://github.com/medialize/ally.js/issues/146
    '?alt+?shift+tab': function altShiftTab(event) {
      // we're completely taking over the Tab key handling
      event.preventDefault();

      var sequence = queryTabsequence({
        context: context
      });

      var backward = event.shiftKey;
      var first = sequence[0];
      var last = sequence[sequence.length - 1];

      // wrap around first to last, last to first
      var source = backward ? first : last;
      var target = backward ? last : first;
      if (isActiveElement(source)) {
        target.focus();
        return;
      }

      // find current position in tabsequence
      var currentIndex = void 0;
      var found = sequence.some(function (element, index) {
        if (!isActiveElement(element)) {
          return false;
        }

        currentIndex = index;
        return true;
      });

      if (!found) {
        // redirect to first as we're not in our tabsequence
        first.focus();
        return;
      }

      // shift focus to previous/next element in the sequence
      var offset = backward ? -1 : 1;
      sequence[currentIndex + offset].focus();
    }
  });
}
//# sourceMappingURL=tab-focus.js.map