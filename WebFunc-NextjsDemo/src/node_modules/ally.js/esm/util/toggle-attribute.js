
// helper to turn
//  <div some-attribute="original">
// into
//  <div data-cached-some-attribute="original">
// and back

export default function (_ref) {
  var element = _ref.element,
      attribute = _ref.attribute;

  var temporaryAttribute = 'data-cached-' + attribute;
  var temporaryAttributeValue = element.getAttribute(temporaryAttribute);

  if (temporaryAttributeValue === null) {
    var _value = element.getAttribute(attribute);
    if (_value === null) {
      // can't remove what's not there
      return;
    }

    element.setAttribute(temporaryAttribute, _value || '');
    element.removeAttribute(attribute);
  } else {
    var _value2 = element.getAttribute(temporaryAttribute);
    element.removeAttribute(temporaryAttribute);
    element.setAttribute(attribute, _value2);
  }
}
//# sourceMappingURL=toggle-attribute.js.map