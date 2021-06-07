
// https://www.w3.org/TR/html5/editing.html#sequential-focus-navigation-and-the-tabindex-attribute
// https://www.w3.org/WAI/PF/aria-practices/#keyboard

import queryFocusable from './focusable';
import isTabbable from '../is/tabbable';

export default function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      includeContext = _ref.includeContext,
      includeOnlyTabbable = _ref.includeOnlyTabbable,
      strategy = _ref.strategy;

  var _isTabbable = isTabbable.rules.except({
    onlyTabbable: includeOnlyTabbable
  });

  return queryFocusable({
    context: context,
    includeContext: includeContext,
    includeOnlyTabbable: includeOnlyTabbable,
    strategy: strategy
  }).filter(_isTabbable);
}
//# sourceMappingURL=tabbable.js.map