
// https://www.w3.org/TR/html5/editing.html#focusable
// https://www.w3.org/WAI/PF/aria-practices/#keyboard

import selector from '../selector/focusable';
import isFocusable from '../is/focusable';

export default function queryFocusableQuick() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      includeContext = _ref.includeContext,
      includeOnlyTabbable = _ref.includeOnlyTabbable;

  var _selector = selector();
  var elements = context.querySelectorAll(_selector);
  // the selector potentially matches more than really is focusable

  var _isFocusable = isFocusable.rules.except({
    onlyTabbable: includeOnlyTabbable
  });

  var result = [].filter.call(elements, _isFocusable);

  // add context if requested and focusable
  if (includeContext && _isFocusable(context)) {
    result.unshift(context);
  }

  return result;
}
//# sourceMappingURL=focusable.quick.js.map