
import getShadowHost from './shadow-host';
import contextToElement from '../util/context-to-element';

export default function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context;

  var list = [];
  var element = contextToElement({
    label: 'get/shadow-host-parents',
    context: context
  });

  while (element) {
    element = getShadowHost({ context: element });
    if (!element) {
      break;
    }

    list.push(element);
  }

  return list;
}
//# sourceMappingURL=shadow-host-parents.js.map