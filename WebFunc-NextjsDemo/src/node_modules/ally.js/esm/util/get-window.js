
import getDocument from './get-document';

export default function (node) {
  var _document = getDocument(node);
  return _document.defaultView || window;
}
//# sourceMappingURL=get-window.js.map