
// https://www.w3.org/TR/html5/editing.html#focusable
// https://www.w3.org/WAI/PF/aria-practices/#keyboard

import contextToElement from '../util/context-to-element';
import queryFocusableStrict from './focusable.strict';
import queryFocusableQuick from './focusable.quick';

export default function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      includeContext = _ref.includeContext,
      includeOnlyTabbable = _ref.includeOnlyTabbable,
      _ref$strategy = _ref.strategy,
      strategy = _ref$strategy === undefined ? 'quick' : _ref$strategy;

  var element = contextToElement({
    label: 'query/focusable',
    resolveDocument: true,
    defaultToDocument: true,
    context: context
  });

  var options = {
    context: element,
    includeContext: includeContext,
    includeOnlyTabbable: includeOnlyTabbable,
    strategy: strategy
  };

  if (strategy === 'quick') {
    return queryFocusableQuick(options);
  } else if (strategy === 'strict' || strategy === 'all') {
    return queryFocusableStrict(options);
  }

  throw new TypeError('query/focusable requires option.strategy to be one of ["quick", "strict", "all"]');
}
//# sourceMappingURL=focusable.js.map