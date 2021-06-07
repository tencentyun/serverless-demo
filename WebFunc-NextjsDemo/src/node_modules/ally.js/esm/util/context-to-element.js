
import nodeArray from '../util/node-array';

export default function (_ref) {
  var context = _ref.context,
      _ref$label = _ref.label,
      label = _ref$label === undefined ? 'context-to-element' : _ref$label,
      resolveDocument = _ref.resolveDocument,
      defaultToDocument = _ref.defaultToDocument;

  var element = nodeArray(context)[0];

  if (resolveDocument && element && element.nodeType === Node.DOCUMENT_NODE) {
    element = element.documentElement;
  }

  if (!element && defaultToDocument) {
    return document.documentElement;
  }

  if (!element) {
    throw new TypeError(label + ' requires valid options.context');
  }

  if (element.nodeType !== Node.ELEMENT_NODE && element.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    throw new TypeError(label + ' requires options.context to be an Element');
  }

  return element;
}
//# sourceMappingURL=context-to-element.js.map