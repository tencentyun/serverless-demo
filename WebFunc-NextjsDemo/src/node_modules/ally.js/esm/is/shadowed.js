
// determine if an element is the child of a ShadowRoot

import contextToElement from '../util/context-to-element';
import getShadowHost from '../get/shadow-host';

export default function (context) {
  var element = contextToElement({
    label: 'is/shadowed',
    resolveDocument: true,
    context: context
  });

  return Boolean(getShadowHost({ context: element }));
}
//# sourceMappingURL=shadowed.js.map